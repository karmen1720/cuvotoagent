import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Step {
  label: string;
  completed: boolean;
  active: boolean;
}

interface StepIndicatorProps {
  steps: Step[];
}

const StepIndicator = ({ steps }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step.completed
                  ? "bg-accent text-accent-foreground"
                  : step.active
                  ? "bg-primary text-primary-foreground ring-2 ring-accent/40"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.completed ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                step.active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-6 sm:w-10 h-0.5 rounded-full ${
                step.completed ? "bg-accent" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
