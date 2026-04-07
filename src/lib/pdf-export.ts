import jsPDF from "jspdf";

interface CompanyHeader {
  company_name: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  gst?: string;
  pan?: string;
  cin?: string;
}

export function exportDocumentToPdf(
  title: string,
  markdownContent: string,
  company?: CompanyHeader
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 15;

  const addNewPageIfNeeded = (needed: number) => {
    if (y + needed > pageH - 20) {
      doc.addPage();
      y = 20;
      addFooter();
    }
  };

  const addFooter = () => {
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${pageCount}`,
      pageW / 2,
      pageH - 10,
      { align: "center" }
    );
    if (company?.company_name) {
      doc.text(company.company_name, marginL, pageH - 10);
    }
    doc.text("Confidential", pageW - marginR, pageH - 10, { align: "right" });
  };

  // === LETTERHEAD ===
  if (company?.company_name) {
    // Top accent line
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1.5);
    doc.line(marginL, y, pageW - marginR, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text(company.company_name.toUpperCase(), marginL, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);

    const details: string[] = [];
    if (company.address) details.push(company.address);
    if (company.contact_email) details.push(`Email: ${company.contact_email}`);
    if (company.contact_phone) details.push(`Phone: ${company.contact_phone}`);
    if (company.gst) details.push(`GSTIN: ${company.gst}`);
    if (company.pan) details.push(`PAN: ${company.pan}`);
    if (company.cin) details.push(`CIN: ${company.cin}`);

    const detailLine = details.join("  |  ");
    const detailLines = doc.splitTextToSize(detailLine, contentW);
    doc.text(detailLines, marginL, y);
    y += detailLines.length * 3.5 + 2;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginL, y, pageW - marginR, y);
    y += 8;
  }

  // === DOCUMENT TITLE ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  const titleLines = doc.splitTextToSize(title, contentW);
  addNewPageIfNeeded(titleLines.length * 7);
  doc.text(titleLines, marginL, y);
  y += titleLines.length * 7 + 4;

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(marginL, y, marginL + 40, y);
  y += 8;

  // === CONTENT ===
  const lines = markdownContent.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      y += 3;
      continue;
    }

    if (trimmed.startsWith("---")) {
      addNewPageIfNeeded(6);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(marginL, y, pageW - marginR, y);
      y += 6;
      continue;
    }

    // Headings
    if (trimmed.startsWith("# ")) {
      const text = trimmed.slice(2);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      const wrapped = doc.splitTextToSize(text, contentW);
      addNewPageIfNeeded(wrapped.length * 6 + 4);
      y += 4;
      doc.text(wrapped, marginL, y);
      y += wrapped.length * 6 + 2;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      const text = trimmed.slice(3);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 138);
      const wrapped = doc.splitTextToSize(text, contentW);
      addNewPageIfNeeded(wrapped.length * 5.5 + 3);
      y += 3;
      doc.text(wrapped, marginL, y);
      y += wrapped.length * 5.5 + 2;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      const text = trimmed.slice(4);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const wrapped = doc.splitTextToSize(text, contentW);
      addNewPageIfNeeded(wrapped.length * 5 + 2);
      y += 2;
      doc.text(wrapped, marginL, y);
      y += wrapped.length * 5 + 2;
      continue;
    }

    if (trimmed.startsWith("#### ")) {
      const text = trimmed.slice(5);
      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      const wrapped = doc.splitTextToSize(text, contentW);
      addNewPageIfNeeded(wrapped.length * 4.5 + 2);
      doc.text(wrapped, marginL, y);
      y += wrapped.length * 4.5 + 2;
      continue;
    }

    // Bold line
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      const text = trimmed.slice(2, -2);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      const wrapped = doc.splitTextToSize(text, contentW);
      addNewPageIfNeeded(wrapped.length * 4.5);
      doc.text(wrapped, marginL, y);
      y += wrapped.length * 4.5 + 1;
      continue;
    }

    // Bullet
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const text = trimmed.slice(2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const wrapped = doc.splitTextToSize(text, contentW - 8);
      addNewPageIfNeeded(wrapped.length * 4);
      // bullet dot
      doc.setFillColor(37, 99, 235);
      doc.circle(marginL + 2, y - 1, 0.8, "F");
      doc.text(wrapped, marginL + 6, y);
      y += wrapped.length * 4 + 1;
      continue;
    }

    // Table row
    if (trimmed.startsWith("|") && trimmed.includes("|")) {
      const cells = trimmed.split("|").filter(Boolean).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) continue;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      addNewPageIfNeeded(5);
      const colW = contentW / cells.length;
      cells.forEach((cell, j) => {
        doc.text(cell, marginL + j * colW, y, { maxWidth: colW - 2 });
      });
      doc.setDrawColor(226, 232, 240);
      doc.line(marginL, y + 1.5, pageW - marginR, y + 1.5);
      y += 5;
      continue;
    }

    // Normal paragraph — strip inline bold markers
    const plainText = trimmed.replace(/\*\*(.*?)\*\*/g, "$1");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const wrapped = doc.splitTextToSize(plainText, contentW);
    addNewPageIfNeeded(wrapped.length * 4);
    doc.text(wrapped, marginL, y);
    y += wrapped.length * 4 + 1;
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${totalPages}`, pageW / 2, pageH - 10, { align: "center" });
    if (company?.company_name) {
      doc.text(company.company_name, marginL, pageH - 10);
    }
    doc.text("Confidential", pageW - marginR, pageH - 10, { align: "right" });
  }

  const filename = `${title.replace(/\s+/g, "_").toLowerCase()}.pdf`;
  doc.save(filename);
}

export function exportAllDocumentsToPdf(
  fullText: string,
  sections: { name: string; content: string }[],
  company?: CompanyHeader
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;

  // Cover page
  let y = 60;
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(2);
  doc.line(marginL, 40, pageW - marginR, 40);

  if (company?.company_name) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text(company.company_name.toUpperCase(), pageW / 2, y, { align: "center" });
    y += 15;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.text("TENDER RESPONSE DOCUMENTS", pageW / 2, y, { align: "center" });
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, pageW / 2, y, { align: "center" });
  y += 8;
  doc.text(`Total Documents: ${sections.length}`, pageW / 2, y, { align: "center" });
  y += 20;

  // Table of contents
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text("TABLE OF CONTENTS", marginL, y);
  y += 8;

  sections.forEach((s, i) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`${i + 1}. ${s.name}`, marginL + 4, y);
    y += 5;
  });

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(2);
  doc.line(marginL, pageH - 30, pageW - marginR, pageH - 30);

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Confidential", pageW / 2, pageH - 24, { align: "center" });
  doc.text("Generated by Cuvoto Tender AI", pageW / 2, pageH - 20, { align: "center" });

  // Each section as new page with letterhead
  sections.forEach((section) => {
    doc.addPage();
    exportSectionToPage(doc, section.name, section.content, company);
  });

  // Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${totalPages}`, pageW / 2, pageH - 10, { align: "center" });
  }

  doc.save("complete_tender_documents.pdf");
}

function exportSectionToPage(
  doc: jsPDF,
  title: string,
  content: string,
  company?: CompanyHeader
) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 15;

  // Letterhead
  if (company?.company_name) {
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1);
    doc.line(marginL, y, pageW - marginR, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(company.company_name, marginL, y);

    const details: string[] = [];
    if (company.gst) details.push(`GSTIN: ${company.gst}`);
    if (company.pan) details.push(`PAN: ${company.pan}`);
    if (details.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(details.join("  |  "), pageW - marginR, y, { align: "right" });
    }
    y += 3;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginL, y, pageW - marginR, y);
    y += 6;
  }

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  const titleLines = doc.splitTextToSize(title, contentW);
  doc.text(titleLines, marginL, y);
  y += titleLines.length * 6 + 4;

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(marginL, y, marginL + 30, y);
  y += 6;

  // Content
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") { y += 2; continue; }
    if (trimmed.startsWith("---")) {
      if (y + 4 > pageH - 20) { doc.addPage(); y = 20; }
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(marginL, y, pageW - marginR, y);
      y += 4;
      continue;
    }

    let fontSize = 9;
    let fontStyle: "normal" | "bold" | "bolditalic" = "normal";
    let color: [number, number, number] = [71, 85, 105];
    let indent = 0;
    let text = trimmed;

    if (trimmed.startsWith("# ")) { text = trimmed.slice(2); fontSize = 13; fontStyle = "bold"; color = [30, 41, 59]; y += 3; }
    else if (trimmed.startsWith("## ")) { text = trimmed.slice(3); fontSize = 11; fontStyle = "bold"; color = [30, 58, 138]; y += 2; }
    else if (trimmed.startsWith("### ")) { text = trimmed.slice(4); fontSize = 10; fontStyle = "bold"; color = [51, 65, 85]; y += 1; }
    else if (trimmed.startsWith("#### ")) { text = trimmed.slice(5); fontSize = 9.5; fontStyle = "bolditalic"; color = [71, 85, 105]; }
    else if (trimmed.startsWith("**") && trimmed.endsWith("**")) { text = trimmed.slice(2, -2); fontStyle = "bold"; color = [30, 41, 59]; }
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) { text = trimmed.slice(2); indent = 6; }
    else if (trimmed.startsWith("|")) {
      const cells = trimmed.split("|").filter(Boolean).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) continue;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      if (y + 5 > pageH - 20) { doc.addPage(); y = 20; }
      const colW = contentW / cells.length;
      cells.forEach((cell, j) => doc.text(cell, marginL + j * colW, y, { maxWidth: colW - 2 }));
      doc.setDrawColor(226, 232, 240);
      doc.line(marginL, y + 1.5, pageW - marginR, y + 1.5);
      y += 5;
      continue;
    }

    text = text.replace(/\*\*(.*?)\*\*/g, "$1");
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const wrapped = doc.splitTextToSize(text, contentW - indent);
    const lineH = fontSize < 10 ? 4 : fontSize < 12 ? 5 : 6;
    if (y + wrapped.length * lineH > pageH - 20) { doc.addPage(); y = 20; }

    if (indent > 0) {
      doc.setFillColor(37, 99, 235);
      doc.circle(marginL + 2, y - 1, 0.7, "F");
    }
    doc.text(wrapped, marginL + indent, y);
    y += wrapped.length * lineH + 1;
  }
}
