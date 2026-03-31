import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

interface ProposalPreviewProps {
  text: string;
}

const ProposalPreview = ({ text }: ProposalPreviewProps) => {
  // Simple markdown-like rendering
  const renderText = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("# ")) {
        return <h1 key={i} className="font-display text-xl font-bold text-foreground mt-6 mb-2">{line.slice(2)}</h1>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={i} className="font-display text-lg font-semibold text-foreground mt-5 mb-2">{line.slice(3)}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={i} className="font-display text-base font-semibold text-foreground mt-4 mb-1">{line.slice(4)}</h3>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={i} className="text-sm text-muted-foreground ml-4 flex items-start gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
            {line.slice(2)}
          </li>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className="text-sm font-semibold text-foreground mt-2">{line.slice(2, -2)}</p>;
      }
      if (line.trim() === "") {
        return <div key={i} className="h-2" />;
      }
      if (line.startsWith("---")) {
        return <hr key={i} className="my-4 border-border" />;
      }
      return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>;
    });
  };

  return (
    <Card className="shadow-[var(--shadow-card)] overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <FileText className="w-4 h-4 text-accent" />
        <h3 className="font-display font-semibold text-foreground">Generated Proposal</h3>
      </div>
      <ScrollArea className="h-[500px]">
        <div className="p-5">
          {renderText(text)}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default ProposalPreview;
