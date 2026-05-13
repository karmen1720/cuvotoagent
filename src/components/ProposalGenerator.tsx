import { motion } from "framer-motion";
import { FileOutput, Loader2, FileText, Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { exportDocumentToPdf } from "@/lib/pdf-export";

interface ProposalGeneratorProps {
  tenderTitle: string;
  onGenerate: () => void;
  isGenerating: boolean;
  proposalReady: boolean;
  proposalText: string;
}

const ProposalGenerator = ({ tenderTitle, onGenerate, isGenerating, proposalReady, proposalText }: ProposalGeneratorProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(proposalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([proposalText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proposal-${tenderTitle.substring(0, 30).replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-5 shadow-[var(--shadow-card)]">
      <h3 className="font-display font-semibold text-foreground text-lg flex items-center gap-2 mb-4">
        <FileOutput className="w-5 h-5 text-accent" />
        Proposal Generator
      </h3>

      <div className="rounded-lg bg-muted p-3 mb-4">
        <p className="text-xs text-muted-foreground">Selected Tender</p>
        <p className="text-sm font-semibold text-foreground mt-0.5 line-clamp-2">{tenderTitle}</p>
      </div>

      {!proposalReady ? (
        <Button
          variant="hero"
          className="w-full"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Proposal...
            </>
          ) : (
            <>
              <FileOutput className="w-4 h-4" />
              Generate Proposal
            </>
          )}
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-3"
        >
          <div className="rounded-lg bg-success/10 border border-success/20 p-4 text-center">
            <p className="text-sm font-semibold text-success">✓ Proposal Generated Successfully</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="gap-2" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="accent" className="gap-2" onClick={handleDownload}>
              <FileText className="w-4 h-4" />
              Download
            </Button>
          </div>
        </motion.div>
      )}
    </Card>
  );
};

export default ProposalGenerator;
