import { motion } from "framer-motion";
import { FileSearch, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface TenderRequirements {
  documents: string[];
  experience: string;
  turnover: string;
  msme_benefits: string[];
  startup_benefits: string[];
}

interface RequirementsDisplayProps {
  requirements: TenderRequirements;
}

const RequirementsDisplay = ({ requirements }: RequirementsDisplayProps) => {
  const sections = [
    {
      title: "Required Documents",
      items: requirements.documents,
      icon: FileSearch,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      title: "MSME Benefits",
      items: requirements.msme_benefits,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Startup Benefits",
      items: requirements.startup_benefits,
      icon: AlertCircle,
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  return (
    <Card className="p-5 shadow-[var(--shadow-card)]">
      <h3 className="font-display font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
        <FileSearch className="w-5 h-5 text-accent" />
        Extracted Requirements
      </h3>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">Min. Experience</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">{requirements.experience}</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">Min. Turnover</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">{requirements.turnover}</p>
        </div>
      </div>

      {/* Lists */}
      <div className="space-y-4">
        {sections.map((section, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-6 h-6 rounded-md ${section.bg} flex items-center justify-center`}>
                <section.icon className={`w-3.5 h-3.5 ${section.color}`} />
              </div>
              <p className="text-sm font-semibold text-foreground">{section.title}</p>
              <Badge variant="secondary" className="text-xs">{section.items.length}</Badge>
            </div>
            <ul className="space-y-1.5 ml-8">
              {section.items.map((item, j) => (
                <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
              {section.items.length === 0 && (
                <li className="text-sm text-muted-foreground italic">None specified</li>
              )}
            </ul>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

export default RequirementsDisplay;
