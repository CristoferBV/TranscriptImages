import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";
import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

export const processOCR = onCall(
  async (request) => {
    const { imageUrl } = request.data;

    if (!imageUrl) {
      throw new Error("Missing imageUrl");
    }

    const result = {
      fullText: "Texto simulado extraído del OCR",
      materials: ["Madera", "Tornillos"],
      measurements: ["50cm", "20cm"],
      instructions: ["Cortar la madera", "Unir las piezas"]
    };

    logger.info("OCR simulated result:", result);
    return result;
  }
);
