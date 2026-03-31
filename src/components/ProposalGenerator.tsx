import { useState } from "react";
import { motion } from "framer-motion";
import { FileOutput, Download, Loader2, Package, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProposalGeneratorProps {
  tenderTitle: string;
  onGenerate: () => void;
  isGenerating: boolean;
  proposalReady: boolean;
}

const ProposalGenerator = ({ tenderTitle, onGenerate, isGenerating, proposalReady }: ProposalGeneratorProps) => {
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
            <Button variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              Proposal
            </Button>
            <Button variant="accent" className="gap-2">
              <Package className="w-4 h-4" />
              ZIP Bundle
            </Button>
          </div>
        </motion.div>
      )}
    </Card>
  );
};

export default ProposalGenerator;
