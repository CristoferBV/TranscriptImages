import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import type { File } from "@google-cloud/storage";
import PDFDocument = require("pdfkit");
import { Workbook } from "exceljs";

// === NEW: Vision ===
import { ImageAnnotatorClient } from "@google-cloud/vision";

admin.initializeApp();
setGlobalOptions({ region: "us-central1", maxInstances: 10 });

const visionClient = new ImageAnnotatorClient();

/** Converts the title to a safe filename (removes / : * ? " < > | etc.) */
function buildFileName(title: string | undefined, ext: "pdf" | "xlsx") {
  const base = (title || "Project")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return `${base}.${ext}`;
}

async function signedUrl(
  file: File,
  filename: string,
  contentType?: string
): Promise<string> {
  const cfg: any = {
    version: "v4",
    action: "read",
    expires: Date.now() + 24 * 60 * 60 * 1000,
    responseDisposition: `attachment; filename="${filename}"`,
  };
  if (contentType) cfg.responseType = contentType;
  const [url] = await file.getSignedUrl(cfg);
  return url;
}

/* =========================
   OCR + PARSING HELPERS
========================= */

function normalize(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[•·●▪◦]/g, "-")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

const KEYWORDS_CONTEXT = [
  // Español carpintería / muebles
  "madera","melamina","mdf","aglomerado","contrachapado","terciado","pino","cedro","roble",
  "corte","cortes","aserrar","serrar","sierra","caladora","inglete","escuadrar",
  "lijar","lija","barniz","tornillo","tornillos","tarugo","escuadra","escuadras",
  "bisagra","bisagras","herrajes","tapacantos","laminado","tablero","tableros",
  "ensamble","ensamblar","unir","pegamento","cola fría","adhesivo",
  "perforar","taladro","avellanar","atornillar","atornille",
  "mueble","gabinete","cajón","repisa","estante","armario","closet","cocina","encimera"
];

const MATERIALS_DICT = [
  "melamina","mdf","aglomerado","contrachapado","terciado","triplay","plywood",
  "pino","roble","cedro","haya","okume","abeto",
  "tornillos","tarugos","cola fría","pegamento","adhesivo","bisagras","herrajes",
  "tapacantos","barniz","laca","sellador","lija","masilla"
];

// Medidas: 50 cm | 20mm | 1/2" | 3/4 pulg | 200 x 300 mm | 18mmx1220mm
const MEASURE_REGEXES: RegExp[] = [
  /\b\d{1,4}\s?(mm|cm|m)\b/gi,
  /\b\d{1,4}\s?x\s?\d{1,4}\s?(mm|cm|m)\b/gi,
  /\b\d{1,4}\s?x\s?\d{1,4}\s?x\s?\d{1,4}\s?(mm|cm|m)\b/gi,
  /\b\d{1,3}\/\d{1,3}\s?(?:\"|pulg(?:adas)?)\b/gi,
  /\b\d{1,3}(\.\d+)?\s?(?:\"|in|pulg(?:adas)?)\b/gi,
  /\b(?:espesor|grosor|alto|ancho|largo)\s*[:\-]?\s*\d{1,4}\s?(mm|cm|m)\b/gi
];

function extractMeasurements(text: string): string[] {
  const found = new Set<string>();
  for (const rx of MEASURE_REGEXES) {
    const matches = text.match(rx);
    if (matches) matches.forEach(m => found.add(m.trim()));
  }
  return Array.from(found);
}

function extractMaterials(text: string): string[] {
  const t = text.toLowerCase();
  const found = new Set<string>();
  for (const m of MATERIALS_DICT) {
    const rx = new RegExp(`\\b${m}\\b`, "i");
    if (rx.test(t)) found.add(m);
  }
  return Array.from(found);
}

// Instrucciones simples: líneas/bullets con verbos de acción
const STEP_HINTS = [
  "corte","cortar","marcar","medir","perforar","taladrar","atornillar","lijar",
  "aplicar","pegar","ensamblar","instalar","fijar","presentar","ajustar","encolar",
  "barnizar","lacar","pintar","avellanar","escuadrar","alinear"
];

function extractInstructions(text: string): string[] {
  const lines = text.split(/\n+/).map(s => s.trim()).filter(Boolean);
  const steps: string[] = [];

  for (let line of lines) {
    const l = line.toLowerCase();
    const looksLikeBullet = /^[-*•\d]+\)?\s+/.test(line);
    const hasVerb = STEP_HINTS.some(v => l.includes(v));
    if (looksLikeBullet || hasVerb) {
      // Limpia enumeradores/bullets al inicio
      line = line.replace(/^[-*•\d]+\)?\s+/, "");
      // Evita líneas excesivamente largas y no técnicas
      if (line.length >= 3 && line.length <= 240) steps.push(line);
    }
  }

  // Dedup conservando orden
  const uniq: string[] = [];
  const seen = new Set<string>();
  for (const s of steps) {
    const key = s.toLowerCase();
    if (!seen.has(key)) {
      uniq.push(s);
      seen.add(key);
    }
  }
  return uniq;
}

function detectCategory(text: string): string | null {
  const t = text.toLowerCase();
  if (/\b(caj[oó]n|gabinete|repisa|estante|armario|closet|mueble|encimera)\b/.test(t))
    return "carpintería/muebles";
  if (/\b(puerta|bisagra|marco|zócalo)\b/.test(t))
    return "carpintería/instalación";
  return null;
}

// Puntaje de “relevancia” carpintería
function relevanceScore(text: string): number {
  const t = text.toLowerCase();
  let score = 0;
  for (const kw of KEYWORDS_CONTEXT) {
    if (t.includes(kw)) score++;
  }
  // Bonifica si hay medidas típicas
  const m = extractMeasurements(text);
  score += Math.min(m.length, 5);
  return score;
}

function shouldProduceArtifacts(text: string, materials: string[], measures: string[], steps: string[], category: string | null): boolean {
  const score = relevanceScore(text);
  // Criterio conservador:
  // - tener categoría o score >= 3
  // - y (algún material o alguna medida o algún paso)
  const hasAny = materials.length > 0 || measures.length > 0 || steps.length > 0;
  return (category !== null || score >= 3) && hasAny;
}

/* =========================
   CLOUD FUNCTION: OCR
========================= */

export const processOCR = onCall(async (request) => {
  try {
    const { imageUrl } = request.data;
    if (!imageUrl) throw new HttpsError("invalid-argument", "Missing imageUrl");

    // Vision puede consumir gs:// o https (si es público o accesible por GCV)
    // Preferimos Document Text Detection para planos/listas
    const [resp] = await visionClient.documentTextDetection({
      image: { source: { imageUri: imageUrl } },
    });

    const fullText = normalize(resp.fullTextAnnotation?.text || "");

    if (!fullText) {
      logger.info("No text detected by Vision.");
      return {
        fullText: "",
        materials: [],
        measurements: [],
        instructions: [],
        category: null,
        relevant: false,
      };
    }

    const materials = extractMaterials(fullText);
    const measurements = extractMeasurements(fullText);
    const instructions = extractInstructions(fullText);
    const category = detectCategory(fullText);

    const relevant = shouldProduceArtifacts(fullText, materials, measurements, instructions, category);

    // Regla de negocio pedida:
    // Si NO hay info relacionada (madera, instalación de muebles, cortes, etc.),
    // devolvemos sin generar listas (vacías).
    if (!relevant) {
      logger.info("Text not relevant to carpentry/furniture/cuts. Returning empty artifacts.");
      return {
        fullText,
        materials: [],
        measurements: [],
        instructions: [],
        category: null,
        relevant: false,
      };
    }

    const result = {
      fullText,
      materials,
      measurements,
      instructions,
      category,
      relevant: true,
    };

    logger.info("Vision OCR result:", {
      materials: result.materials,
      measurements: result.measurements,
      instructionsCount: result.instructions.length,
      category: result.category,
      relevant: result.relevant,
    });

    return result;
  } catch (err: any) {
    logger.error("processOCR error:", err);
    throw new HttpsError("internal", err?.message || "processOCR failed");
  }
});

/* =========================
   PDF (igual que tu versión)
========================= */
export const generatePDF = onCall(async (req) => {
  try {
    const project = req.data?.project;
    if (!project) throw new HttpsError("invalid-argument", "Missing project");

    const bucket = admin.storage().bucket();
    const objectPath = `exports/${project.id || Date.now()}-${Date.now()}.pdf`;
    const file = bucket.file(objectPath);

    const downloadName = buildFileName(project.title, "pdf");

    const stream = file.createWriteStream({
      metadata: {
        contentType: "application/pdf",
        contentDisposition: `attachment; filename="${downloadName}"`,
        cacheControl: "public, max-age=3600",
      },
    });

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(stream);

    doc.fontSize(18).text(project.title || "Project", { underline: true });
    doc.moveDown();

    doc.fontSize(12).text("Materials:");
    (project.materials || []).forEach((m: string) => doc.text(`• ${m}`));
    doc.moveDown();

    doc.text("Measurements:");
    (project.measurements || []).forEach((m: string) => doc.text(`• ${m}`));
    doc.moveDown();

    doc.text("Steps:");
    (project.instructions || []).forEach((s: string, i: number) =>
      doc.text(`${i + 1}. ${s}`)
    );

    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    const downloadUrl = await signedUrl(
      file,
      downloadName,
      "application/pdf"
    );

    return { downloadUrl, filename: downloadName };
  } catch (err: any) {
    logger.error("generatePDF error:", err);
    throw new HttpsError("internal", err?.message || "generatePDF failed");
  }
});

/* =========================
   Excel (igual que tu versión)
========================= */
export const generateExcel = onCall(async (req) => {
  try {
    const project = req.data?.project;
    if (!project) throw new HttpsError("invalid-argument", "Missing project");

    const wb = new Workbook();
    const ws = wb.addWorksheet("Project");

    ws.columns = [
      { header: "Section", key: "section", width: 20 },
      { header: "Value", key: "value", width: 60 },
    ];

    ws.addRow({ section: "Title", value: project.title || "Project" });
    ws.addRow({});
    ws.addRow({
      section: "Materials",
      value: (project.materials || []).join(", "),
    });
    ws.addRow({
      section: "Measurements",
      value: (project.measurements || []).join(", "),
    });
    ws.addRow({
      section: "Steps",
      value: (project.instructions || []).join(" | "),
    });

    const buffer = await wb.xlsx.writeBuffer();
    const uint8Array =
      buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer);

    const bucket = admin.storage().bucket();
    const objectPath = `exports/${project.id || Date.now()}-${Date.now()}.xlsx`;
    const file = bucket.file(objectPath);

    const downloadName = buildFileName(project.title, "xlsx");

    await file.save(uint8Array, {
      resumable: false,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      metadata: {
        cacheControl: "public, max-age=3600",
        contentDisposition: `attachment; filename="${downloadName}"`,
      },
    });

    const downloadUrl = await signedUrl(
      file,
      downloadName,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return { downloadUrl, filename: downloadName };
  } catch (err: any) {
    logger.error("generateExcel error:", err);
    throw new HttpsError("internal", err?.message || "generateExcel failed");
  }
});
