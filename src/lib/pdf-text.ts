import * as pdfjsLib from "pdfjs-dist";

// Use a worker compatible with our pdfjs version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => it.str).join(" ") + "\n";
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
