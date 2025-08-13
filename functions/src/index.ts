import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import type { File } from "@google-cloud/storage";
import PDFDocument = require("pdfkit");
import { Workbook } from "exceljs";

admin.initializeApp();
setGlobalOptions({ region: "us-central1", maxInstances: 10 });

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

// --- Simulated OCR ---
export const processOCR = onCall(async (request) => {
  try {
    const { imageUrl } = request.data;
    if (!imageUrl) throw new HttpsError("invalid-argument", "Missing imageUrl");

    const result = {
      fullText: "Texto simulado extraído del OCR",
      materials: ["Madera", "Tornillos"],
      measurements: ["50cm", "20cm"],
      instructions: ["Cortar la madera", "Unir las piezas"],
    };

    logger.info("OCR simulated result:", result);
    return result;
  } catch (err: any) {
    logger.error("processOCR error:", err);
    throw new HttpsError("internal", err?.message || "processOCR failed");
  }
});

// --- PDF ---
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

// --- Excel ---
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
