import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, FileText, Link as LinkIcon, ClipboardPaste, Paperclip, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

interface TenderUploaderProps {
  onExcelUpload: (file: File) => void;
  onPdfUpload: (file: File) => void;
  onSheetUrl: (url: string) => void;
  onPasteText?: (text: string) => void;
  excelFile: File | null;
  pdfFile: File | null;
  supportingFiles?: File[];
  onSupportingFilesChange?: (files: File[]) => void;
}

const TenderUploader = ({ onExcelUpload, onPdfUpload, onSheetUrl, onPasteText, excelFile, pdfFile, supportingFiles = [], onSupportingFilesChange }: TenderUploaderProps) => {
  const [sheetUrl, setSheetUrl] = useState("");
  const [dragOverExcel, setDragOverExcel] = useState(false);
  const [dragOverPdf, setDragOverPdf] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pastedText, setPastedText] = useState("");

  const handleDrop = useCallback(
    (type: "excel" | "pdf") => (e: React.DragEvent) => {
      e.preventDefault();
      type === "excel" ? setDragOverExcel(false) : setDragOverPdf(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        type === "excel" ? onExcelUpload(file) : onPdfUpload(file);
      }
    },
    [onExcelUpload, onPdfUpload]
  );

  return (
    <div className="space-y-4">
      {/* Google Sheet URL */}
      <Card className="p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 mb-3">
          <LinkIcon className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Google Sheet URL</span>
          <span className="text-xs text-muted-foreground">(optional)</span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="https://docs.google.com/spreadsheets/..."
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            className="text-sm"
          />
          <Button variant="accent" size="sm" onClick={() => sheetUrl && onSheetUrl(sheetUrl)} disabled={!sheetUrl}>
            Load
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Excel Upload */}
        <Card
          className={`p-5 border-2 border-dashed transition-colors cursor-pointer shadow-[var(--shadow-card)] ${
            dragOverExcel ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOverExcel(true); }}
          onDragLeave={() => setDragOverExcel(false)}
          onDrop={handleDrop("excel")}
          onClick={() => document.getElementById("excel-input")?.click()}
        >
          <input
            id="excel-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onExcelUpload(e.target.files[0])}
          />
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Tender List (Excel)</p>
              <p className="text-xs text-muted-foreground mt-1">Upload .xlsx or .csv</p>
            </div>
            <AnimatePresence>
              {excelFile && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-success/10 rounded-lg px-3 py-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-success" />
                  <span className="text-xs font-medium text-success truncate max-w-[140px]">{excelFile.name}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* PDF Upload */}
        <Card
          className={`p-5 border-2 border-dashed transition-colors cursor-pointer shadow-[var(--shadow-card)] ${
            dragOverPdf ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOverPdf(true); }}
          onDragLeave={() => setDragOverPdf(false)}
          onDrop={handleDrop("pdf")}
          onClick={() => document.getElementById("pdf-input")?.click()}
        >
          <input id="pdf-input" type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && onPdfUpload(e.target.files[0])} />
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Tender PDF</p>
              <p className="text-xs text-muted-foreground mt-1">Upload tender document</p>
            </div>
            <AnimatePresence>
              {pdfFile && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-success/10 rounded-lg px-3 py-1.5">
                  <FileText className="w-4 h-4 text-success" />
                  <span className="text-xs font-medium text-success truncate max-w-[140px]">{pdfFile.name}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </div>

      {/* Supporting documents (multiple PDFs) */}
      {onSupportingFilesChange && (
        <Card className="p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-foreground">Supporting Documents</span>
              <span className="text-xs text-muted-foreground">(optional, multiple PDFs)</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("supporting-input")?.click()}
            >
              Add files
            </Button>
            <input
              id="supporting-input"
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length) onSupportingFilesChange([...(supportingFiles || []), ...files]);
                e.target.value = "";
              }}
            />
          </div>
          {supportingFiles.length > 0 ? (
            <ul className="space-y-1.5">
              {supportingFiles.map((f, i) => (
                <li key={i} className="flex items-center justify-between bg-muted/40 rounded-md px-3 py-1.5">
                  <span className="text-xs text-foreground truncate flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-primary" /> {f.name}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => onSupportingFilesChange(supportingFiles.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Attach annexures, BOQs, past-experience proofs etc. They will be analyzed alongside the main tender.</p>
          )}
        </Card>
      )}

      {/* Paste tender text fallback */}
      {onPasteText && (
        <Card className="p-4 shadow-[var(--shadow-card)]">
          <button
            type="button"
            onClick={() => setShowPaste((s) => !s)}
            className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent transition-colors"
          >
            <ClipboardPaste className="w-4 h-4 text-accent" />
            Paste tender text manually
            <span className="text-xs text-muted-foreground font-normal">(use if PDF extraction fails)</span>
          </button>
          {showPaste && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Paste the full tender document text here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={6}
                className="text-sm"
              />
              <Button
                variant="accent"
                size="sm"
                onClick={() => { if (pastedText.trim()) { onPasteText(pastedText); setPastedText(""); setShowPaste(false); } }}
                disabled={!pastedText.trim()}
              >
                Use this text
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default TenderUploader;
