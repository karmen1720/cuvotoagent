import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface EligibilityResult {
  label: string;
  eligible: boolean;
  detail: string;
}

interface EligibilityCheckerProps {
  results: EligibilityResult[];
  overallScore: number;
}

const EligibilityChecker = ({ results, overallScore }: EligibilityCheckerProps) => {
  const scoreColor = overallScore >= 75 ? "text-success" : overallScore >= 50 ? "text-warning" : "text-destructive";
  const scoreBg = overallScore >= 75 ? "bg-success" : overallScore >= 50 ? "bg-warning" : "bg-destructive";

  return (
    <Card className="p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-semibold text-foreground text-lg flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent" />
          Eligibility Check
        </h3>
        <div className="text-right">
          <p className={`text-2xl font-display font-bold ${scoreColor}`}>{overallScore}%</p>
          <p className="text-xs text-muted-foreground">Match Score</p>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full h-2 rounded-full bg-muted mb-5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${scoreBg}`}
          initial={{ width: 0 }}
          animate={{ width: `${overallScore}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-3">
        {results.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`flex items-start gap-3 rounded-lg p-3 ${
              item.eligible ? "bg-success/5" : "bg-destructive/5"
            }`}
          >
            {item.eligible ? (
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

export default EligibilityChecker;
