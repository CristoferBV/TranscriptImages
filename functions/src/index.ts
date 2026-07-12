import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import type { File } from "@google-cloud/storage";
import PDFDocument = require("pdfkit");
import { Workbook } from "exceljs";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import * as https from "https";
import * as http from "http";

admin.initializeApp();
setGlobalOptions({ region: "us-central1", maxInstances: 10 });

let visionClient: ImageAnnotatorClient | null = null;
const getVisionClient = () => {
  if (!visionClient) visionClient = new ImageAnnotatorClient();
  return visionClient;
};

interface ProjectPage {
  imageUrl: string;
  fullText: string;
}

interface Project {
  id?: string;
  title?: string;
  pages: ProjectPage[];
}

function buildFileName(title: string | undefined, ext: "pdf" | "xlsx") {
  const base = (title || "Documento")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return `${base}.${ext}`;
}

async function signedUrl(file: File, filename: string, contentType?: string): Promise<string> {
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

function normalize(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[•·●▪◦]/g, "-")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function fetchImageBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

/* =========================
   OCR
========================= */
export const processOCR = onCall(async (request) => {
  try {
    const { imageUrl } = request.data;
    if (!imageUrl) throw new HttpsError("invalid-argument", "Missing imageUrl");

    const [resp] = await getVisionClient().documentTextDetection({
      image: { source: { imageUri: imageUrl } },
    });

    const fullText = normalize(resp.fullTextAnnotation?.text || "");

    if (!fullText) {
      logger.info("No text detected by Vision.");
      return { fullText: "" };
    }

    logger.info("Vision OCR result:", { chars: fullText.length });
    return { fullText };
  } catch (err: any) {
    logger.error("processOCR error:", err);
    throw new HttpsError("internal", err?.message || "processOCR failed");
  }
});

/* =========================
   PDF — una página por imagen
========================= */
export const generatePDF = onCall(async (req) => {
  try {
    const project: Project = req.data?.project;
    if (!project) throw new HttpsError("invalid-argument", "Missing project");

    const pages: ProjectPage[] = project.pages || [];
    if (!pages.length) throw new HttpsError("invalid-argument", "Project has no pages");

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

    const doc = new PDFDocument({ size: "A4", margin: 50, autoFirstPage: false });
    doc.pipe(stream);

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      doc.addPage();

      // Encabezado
      doc.fontSize(16).font("Helvetica-Bold").text(project.title || "Documento", 50, 50);
      if (pages.length > 1) {
        doc.fontSize(10).font("Helvetica").fillColor("#888888")
          .text(`Página ${i + 1} de ${pages.length}`, { align: "right" });
        doc.fillColor("#000000");
      }

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke("#cccccc");
      doc.moveDown(1);

      // Imagen
      try {
        const imgBuffer = await fetchImageBuffer(page.imageUrl);
        const imgY = doc.y;
        const maxImgHeight = 280;
        doc.image(imgBuffer, 50, imgY, { fit: [495, maxImgHeight], align: "center" });
        doc.moveDown(maxImgHeight / doc.currentLineHeight(true) + 1);
      } catch (imgErr) {
        logger.warn(`Could not embed image for page ${i + 1}:`, imgErr);
        doc.fontSize(9).fillColor("#888888").text("[Imagen no disponible]");
        doc.fillColor("#000000");
      }

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke("#eeeeee");
      doc.moveDown(0.75);

      // Texto extraído
      if (page.fullText) {
        doc.fontSize(10).font("Helvetica").text(page.fullText, { lineGap: 4 });
      } else {
        doc.fontSize(9).fillColor("#aaaaaa").text("Sin texto extraído para esta página.");
        doc.fillColor("#000000");
      }
    }

    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    const downloadUrl = await signedUrl(file, downloadName, "application/pdf");
    return { downloadUrl, filename: downloadName };
  } catch (err: any) {
    logger.error("generatePDF error:", err);
    throw new HttpsError("internal", err?.message || "generatePDF failed");
  }
});

/* =========================
   Excel — hoja resumen + una hoja por página
========================= */
export const generateExcel = onCall(async (req) => {
  try {
    const project: Project = req.data?.project;
    if (!project) throw new HttpsError("invalid-argument", "Missing project");

    const pages: ProjectPage[] = project.pages || [];
    if (!pages.length) throw new HttpsError("invalid-argument", "Project has no pages");

    const wb = new Workbook();
    wb.creator = "Digidoc CR";
    wb.created = new Date();

    // Hoja resumen
    const summary = wb.addWorksheet("Resumen");
    summary.columns = [
      { header: "Campo", key: "field", width: 20 },
      { header: "Valor", key: "value", width: 80 },
    ];
    summary.addRow({ field: "Título", value: project.title || "Documento" });
    summary.addRow({ field: "Total de páginas", value: pages.length });
    summary.addRow({ field: "Fecha de exportación", value: new Date().toLocaleString("es-CR") });
    summary.addRow({});
    summary.addRow({ field: "Texto completo", value: pages.map(p => p.fullText).join("\n\n") });

    // Una hoja por página
    pages.forEach((page, i) => {
      const ws = wb.addWorksheet(`Página ${i + 1}`);
      ws.columns = [
        { header: "Campo", key: "field", width: 20 },
        { header: "Valor", key: "value", width: 80 },
      ];
      ws.addRow({ field: "Página", value: i + 1 });
      ws.addRow({ field: "URL de imagen", value: page.imageUrl });
      ws.addRow({});
      ws.addRow({ field: "Texto extraído", value: page.fullText || "Sin texto extraído" });
    });

    const buffer = await wb.xlsx.writeBuffer();
    const uint8Array = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer);

    const bucket = admin.storage().bucket();
    const objectPath = `exports/${project.id || Date.now()}-${Date.now()}.xlsx`;
    const file = bucket.file(objectPath);
    const downloadName = buildFileName(project.title, "xlsx");

    await file.save(uint8Array, {
      resumable: false,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
