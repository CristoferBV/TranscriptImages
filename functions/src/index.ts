import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import type { File } from "@google-cloud/storage";
import PDFDocument = require("pdfkit");
import { Workbook } from "exceljs";
import { ImageAnnotatorClient } from "@google-cloud/vision";

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

async function signedUrl(file: File, filename: string, disposition: "inline" | "attachment", contentType?: string): Promise<string> {
  const cfg: any = {
    version: "v4",
    action: "read",
    expires: Date.now() + 24 * 60 * 60 * 1000,
    responseDisposition: `${disposition}; filename="${filename}"`,
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
   PDF — solo texto, abre en vista previa
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
        contentDisposition: `inline; filename="${downloadName}"`,
        cacheControl: "public, max-age=3600",
      },
    });

    const footerText = `Digidoc CR — ${new Date().toLocaleDateString("es-CR")}`;
    const doc = new PDFDocument({ size: "A4", margin: 60, autoFirstPage: false, bufferPages: true });
    doc.pipe(stream);

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      doc.addPage();

      // Título
      doc.fontSize(18).font("Helvetica-Bold")
        .fillColor("#111111")
        .text(project.title || "Documento", { align: "left" });

      if (pages.length > 1) {
        doc.fontSize(10).font("Helvetica").fillColor("#888888")
          .text(`Página ${i + 1} de ${pages.length}`, { align: "right" });
      }

      doc.moveDown(0.5);
      doc.moveTo(60, doc.y).lineTo(535, doc.y).lineWidth(0.5).stroke("#cccccc");
      doc.moveDown(1);

      // Texto
      if (page.fullText) {
        doc.fontSize(11).font("Helvetica").fillColor("#222222")
          .text(page.fullText, { lineGap: 5, paragraphGap: 8 });
      } else {
        doc.fontSize(10).fillColor("#aaaaaa").text("Sin texto extraído para esta página.");
      }
    }

    // Footer: iterar páginas en buffer sin mover el cursor de flujo
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      // Guardar estado, resetear márgenes y escribir footer en posición absoluta
      doc.save();
      doc.fontSize(8).font("Helvetica").fillColor("#bbbbbb");
      const footerY = doc.page.height - 50;
      doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };
      doc.text(footerText, 0, footerY, { align: "center", width: doc.page.width, lineBreak: false });
      doc.restore();
    }

    doc.flushPages();
    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    const downloadUrl = await signedUrl(file, downloadName, "inline", "application/pdf");
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
      "attachment",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return { downloadUrl, filename: downloadName };
  } catch (err: any) {
    logger.error("generateExcel error:", err);
    throw new HttpsError("internal", err?.message || "generateExcel failed");
  }
});
