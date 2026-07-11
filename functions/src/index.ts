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

const visionClient = new ImageAnnotatorClient();

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

/* =========================
   OCR
========================= */
export const processOCR = onCall(async (request) => {
  try {
    const { imageUrl } = request.data;
    if (!imageUrl) throw new HttpsError("invalid-argument", "Missing imageUrl");

    const [resp] = await visionClient.documentTextDetection({
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
   PDF
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

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(stream);

    doc.fontSize(20).font("Helvetica-Bold").text(project.title || "Documento", { underline: false });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke("#cccccc");
    doc.moveDown(1);
    doc.fontSize(11).font("Helvetica").text(project.fullText || "", { lineGap: 4 });
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
   Excel
========================= */
export const generateExcel = onCall(async (req) => {
  try {
    const project = req.data?.project;
    if (!project) throw new HttpsError("invalid-argument", "Missing project");

    const wb = new Workbook();
    const ws = wb.addWorksheet("Documento");

    ws.columns = [
      { header: "Campo", key: "field", width: 20 },
      { header: "Valor", key: "value", width: 80 },
    ];

    ws.addRow({ field: "Título", value: project.title || "Documento" });
    ws.addRow({ field: "Texto extraído", value: project.fullText || "" });

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
