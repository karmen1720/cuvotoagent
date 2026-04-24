// Reliable PDF text extraction using pdf.js (Mozilla).
// Handles modern CIDFont/ToUnicode encoding that the prior byte-scan missed.

import * as pdfjsLib from "pdfjs-dist";
// Vite worker URL import — pdf.js requires a worker.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc;

export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items
        .map((it: any) => ("str" in it ? it.str : ""))
        .filter(Boolean);
      pages.push(strings.join(" "));
    } catch (e) {
      console.warn(`[pdf-text] page ${i} failed`, e);
    }
  }

  const text = pages.join("\n\n").trim();
  return text;
}
