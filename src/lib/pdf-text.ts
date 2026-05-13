import * as pdfjsLib from "pdfjs-dist";

// Use a worker compatible with our pdfjs version (v4 uses .mjs)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

export class PdfExtractionError extends Error {
  code: "no_text" | "scanned_or_protected" | "unreadable";
  constructor(code: PdfExtractionError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "PdfExtractionError";
  }
}

export async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = "";
  const BATCH_SIZE = 10;

  for (let i = 1; i <= pdf.numPages; i += BATCH_SIZE) {
    const batchPromises = [];
    const end = Math.min(i + BATCH_SIZE - 1, pdf.numPages);
    
    for (let j = i; j <= end; j++) {
      batchPromises.push(
        pdf.getPage(j).then(async (page) => {
          const content = await page.getTextContent();
          return content.items.map((it: any) => it.str).join(" ");
        })
      );
    }
    
    const batchTexts = await Promise.all(batchPromises);
    text += batchTexts.join("\n") + "\n";
  }

  text = text.trim();
  if (!text || text.length < 200) {
    throw new PdfExtractionError(
      "scanned_or_protected",
      "PDF appears to be scanned or protected — no readable text was found. Paste the tender text manually using the box below.",
    );
  }
  return text;
}
