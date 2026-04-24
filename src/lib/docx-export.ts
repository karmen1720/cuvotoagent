// DOCX export using docx-js. Generates individual or bundled tender documents
// with company letterhead in headers and page numbers in footers.

import {
  Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType,
  HeadingLevel, LevelFormat, PageNumber, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType,
} from "docx";
import { saveAs } from "file-saver";

interface CompanyHeader {
  company_name: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  gst?: string;
  pan?: string;
  cin?: string;
}

function buildHeader(company?: CompanyHeader): Header {
  if (!company?.company_name) {
    return new Header({ children: [new Paragraph("")] });
  }
  const detailParts: string[] = [];
  if (company.gst) detailParts.push(`GSTIN: ${company.gst}`);
  if (company.pan) detailParts.push(`PAN: ${company.pan}`);
  if (company.cin) detailParts.push(`CIN: ${company.cin}`);

  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: company.company_name.toUpperCase(), bold: true, size: 24 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: company.address || "", size: 16, color: "555555" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: detailParts.join("  |  "), size: 16, color: "555555" })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2563EB", space: 4 } },
      }),
    ],
  });
}

function buildFooter(company?: CompanyHeader): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: company?.company_name ? `${company.company_name}  ·  ` : "", size: 14, color: "888888" }),
          new TextRun({ text: "Page ", size: 14, color: "888888" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "888888" }),
          new TextRun({ text: " of ", size: 14, color: "888888" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: "888888" }),
        ],
      }),
    ],
  });
}

function parseTableRow(line: string): string[] | null {
  if (!line.startsWith("|") || !line.includes("|")) return null;
  const cells = line.split("|").filter(Boolean).map((c) => c.trim());
  if (cells.every((c) => /^[-:]+$/.test(c))) return null; // separator row
  return cells;
}

function markdownToDocxChildren(markdown: string): (Paragraph | Table)[] {
  const lines = markdown.split("\n");
  const children: (Paragraph | Table)[] = [];
  let tableBuffer: string[][] | null = null;

  const flushTable = () => {
    if (!tableBuffer || tableBuffer.length === 0) return;
    const cols = Math.max(...tableBuffer.map((r) => r.length));
    const colWidth = Math.floor(9000 / cols);
    const rows = tableBuffer.map((row, idx) => {
      const cells = Array.from({ length: cols }).map((_, i) => {
        return new TableCell({
          width: { size: colWidth, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
          shading: idx === 0 ? { fill: "E5EDF7", type: ShadingType.CLEAR, color: "auto" } : undefined,
          children: [
            new Paragraph({
              children: [new TextRun({ text: row[i] ?? "", bold: idx === 0, size: 18 })],
            }),
          ],
        });
      });
      return new TableRow({ children: cells });
    });
    children.push(new Table({
      width: { size: 9000, type: WidthType.DXA },
      columnWidths: Array.from({ length: cols }).map(() => colWidth),
      rows,
    }));
    tableBuffer = null;
  };

  for (const raw of lines) {
    const line = raw.trim();

    const tableRow = parseTableRow(line);
    if (tableRow) {
      if (!tableBuffer) tableBuffer = [];
      tableBuffer.push(tableRow);
      continue;
    } else {
      flushTable();
    }

    if (line === "") {
      children.push(new Paragraph(""));
      continue;
    }
    if (line.startsWith("---")) {
      children.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 1 } },
        children: [new TextRun("")],
      }));
      continue;
    }
    if (line.startsWith("# ")) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: line.slice(2), bold: true, size: 28 })] }));
      continue;
    }
    if (line.startsWith("## ")) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: line.slice(3), bold: true, size: 24 })] }));
      continue;
    }
    if (line.startsWith("### ")) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: line.slice(4), bold: true, size: 22 })] }));
      continue;
    }
    if (line.startsWith("#### ")) {
      children.push(new Paragraph({ children: [new TextRun({ text: line.slice(5), bold: true, italics: true, size: 20 })] }));
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      children.push(new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: line.slice(2), size: 20 })],
      }));
      continue;
    }
    // Inline bold
    const segments = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    const runs = segments.map((seg) => {
      if (seg.startsWith("**") && seg.endsWith("**")) {
        return new TextRun({ text: seg.slice(2, -2), bold: true, size: 20 });
      }
      return new TextRun({ text: seg, size: 20 });
    });
    children.push(new Paragraph({ children: runs }));
  }
  flushTable();

  return children;
}

const NUMBERING_CONFIG = {
  config: [
    {
      reference: "bullets",
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        },
      ],
    },
  ],
};

export async function exportDocumentToDocx(
  title: string,
  markdown: string,
  company?: CompanyHeader
): Promise<void> {
  const titlePara = new Paragraph({
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: title, bold: true, size: 32 })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "2563EB", space: 4 } },
  });

  const doc = new Document({
    creator: company?.company_name || "Cuvoto Tender AI",
    numbering: NUMBERING_CONFIG,
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 },
        },
      },
      headers: { default: buildHeader(company) },
      footers: { default: buildFooter(company) },
      children: [titlePara, new Paragraph(""), ...markdownToDocxChildren(markdown)],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/\s+/g, "_").toLowerCase()}.docx`);
}

export async function exportAllDocumentsToDocx(
  sections: { name: string; content: string }[],
  company?: CompanyHeader
): Promise<void> {
  const allChildren: (Paragraph | Table)[] = [];

  // Cover
  if (company?.company_name) {
    allChildren.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: company.company_name.toUpperCase(), bold: true, size: 40 })],
    }));
  }
  allChildren.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "TENDER RESPONSE DOCUMENTS", bold: true, size: 28, color: "2563EB" })],
  }));
  allChildren.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, size: 18, color: "555555" })],
  }));
  allChildren.push(new Paragraph(""));
  allChildren.push(new Paragraph({
    children: [new TextRun({ text: "TABLE OF CONTENTS", bold: true, size: 22 })],
  }));
  sections.forEach((s, i) => {
    allChildren.push(new Paragraph({
      children: [new TextRun({ text: `${i + 1}. ${s.name}`, size: 20 })],
    }));
  });
  allChildren.push(new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }));

  sections.forEach((section, idx) => {
    allChildren.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: section.name, bold: true, size: 28, color: "2563EB" })],
    }));
    allChildren.push(...markdownToDocxChildren(section.content));
    if (idx < sections.length - 1) {
      allChildren.push(new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }));
    }
  });

  const doc = new Document({
    creator: company?.company_name || "Cuvoto Tender AI",
    numbering: NUMBERING_CONFIG,
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 },
        },
      },
      headers: { default: buildHeader(company) },
      footers: { default: buildFooter(company) },
      children: allChildren,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "complete_tender_documents.docx");
}
