import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Copy, Check, ChevronDown, ChevronRight, FileDown } from "lucide-react";
import { exportDocumentToPdf, exportAllDocumentsToPdf } from "@/lib/pdf-export";
import type { CompanyData } from "@/components/CompanyProfile";

interface ProposalPreviewProps {
  text: string;
  company?: CompanyData;
}

interface DocumentSection {
  name: string;
  content: string;
}

function parseDocuments(text: string): DocumentSection[] {
  const delimiter = /===DOCUMENT:\s*(.+?)===/g;
  const sections: DocumentSection[] = [];
  let match;

  const matches: { name: string; index: number }[] = [];
  while ((match = delimiter.exec(text)) !== null) {
    matches.push({ name: match[1].trim(), index: match.index + match[0].length });
  }

  if (matches.length === 0) {
    return [{ name: "Complete Proposal", content: text }];
  }

  const preamble = text.substring(0, matches[0].index - `===DOCUMENT: ${matches[0].name}===`.length).trim();
  if (preamble) {
    sections.push({ name: "Overview", content: preamble });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length
      ? text.lastIndexOf("===DOCUMENT:", matches[i + 1].index)
      : text.length;
    sections.push({ name: matches[i].name, content: text.substring(start, end).trim() });
  }

  return sections;
}

function renderMarkdown(content: string) {
  return content.split("\n").map((line, i) => {
    if (line.startsWith("# ")) return <h1 key={i} className="font-display text-xl font-bold text-foreground mt-6 mb-2">{line.slice(2)}</h1>;
    if (line.startsWith("## ")) return <h2 key={i} className="font-display text-lg font-semibold text-foreground mt-5 mb-2">{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i} className="font-display text-base font-semibold text-foreground mt-4 mb-1">{line.slice(4)}</h3>;
    if (line.startsWith("#### ")) return <h4 key={i} className="text-sm font-semibold text-foreground mt-3 mb-1">{line.slice(5)}</h4>;
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <li key={i} className="text-sm text-muted-foreground ml-4 flex items-start gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
          {line.slice(2)}
        </li>
      );
    }
    if (line.startsWith("|") && line.includes("|")) {
      const cells = line.split("|").filter(Boolean).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) return null;
      return (
        <div key={i} className="grid gap-2 text-xs text-muted-foreground border-b border-border py-1" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
          {cells.map((cell, j) => <span key={j} className="px-1">{cell}</span>)}
        </div>
      );
    }
    if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-sm font-semibold text-foreground mt-2">{line.slice(2, -2)}</p>;
    if (line.trim() === "") return <div key={i} className="h-2" />;
    if (line.startsWith("---")) return <hr key={i} className="my-4 border-border" />;
    return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>;
  });
}

const DocumentCard = ({ section, index, company }: { section: DocumentSection; index: number; company?: CompanyData }) => {
  const [expanded, setExpanded] = useState(index === 0);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(section.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([section.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${section.name.replace(/\s+/g, "_").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    exportDocumentToPdf(section.name, section.content, company ? {
      company_name: company.company_name,
      address: company.address,
      contact_email: company.contact_email,
      contact_phone: company.contact_phone,
      gst: company.gst,
      pan: company.pan,
      cin: company.cin,
    } : undefined);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-4 h-4 text-accent" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          <FileText className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">{section.name}</span>
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Copy" onClick={handleCopy}>
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Download PDF" onClick={handleDownloadPdf}>
            <FileDown className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Download Markdown" onClick={handleDownloadMd}>
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </button>
      {expanded && (
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {renderMarkdown(section.content)}
        </div>
      )}
    </div>
  );
};

const ProposalPreview = ({ text, company }: ProposalPreviewProps) => {
  const sections = parseDocuments(text);
  const [copied, setCopied] = useState(false);

  const companyHeader = company ? {
    company_name: company.company_name,
    address: company.address,
    contact_email: company.contact_email,
    contact_phone: company.contact_phone,
    gst: company.gst,
    pan: company.pan,
    cin: company.cin,
  } : undefined;

  const handleDownloadAllPdf = () => {
    exportAllDocumentsToPdf(text, sections, companyHeader);
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="shadow-[var(--shadow-card)] overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent" />
          <h3 className="font-display font-semibold text-foreground">
            Generated Documents ({sections.length})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleCopyAll}>
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy All"}
          </Button>
          <Button variant="accent" size="sm" className="gap-1.5 text-xs" onClick={handleDownloadAllPdf}>
            <FileDown className="w-3 h-3" />
            Download All PDF
          </Button>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {sections.map((section, i) => (
          <DocumentCard key={i} section={section} index={i} company={company} />
        ))}
      </div>
    </Card>
  );
};

export default ProposalPreview;
