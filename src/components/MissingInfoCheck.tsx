import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CompanyData } from "@/components/CompanyProfile";

interface MissingInfoCheckProps {
  company: CompanyData;
  onEditProfile: () => void;
  onProceedAnyway: () => void;
}

const requiredFields: { key: keyof CompanyData; label: string; critical: boolean }[] = [
  { key: "pan", label: "PAN Number", critical: true },
  { key: "gst", label: "GST Number", critical: true },
  { key: "address", label: "Registered Address", critical: true },
  { key: "contact_person", label: "Contact Person", critical: true },
  { key: "contact_email", label: "Email Address", critical: true },
  { key: "contact_phone", label: "Phone Number", critical: false },
  { key: "tan", label: "TAN Number", critical: false },
  { key: "cin", label: "CIN Number", critical: false },
  { key: "annual_turnover", label: "Annual Turnover", critical: false },
  { key: "years_experience", label: "Years of Experience", critical: false },
  { key: "employees_count", label: "Employee Count", critical: false },
  { key: "bank_name", label: "Bank Details", critical: false },
];

const MissingInfoCheck = ({ company, onEditProfile, onProceedAnyway }: MissingInfoCheckProps) => {
  const missing = requiredFields.filter((f) => {
    const val = company[f.key];
    if (Array.isArray(val)) return val.length === 0;
    return !val;
  });

  const criticalMissing = missing.filter((f) => f.critical);
  const optionalMissing = missing.filter((f) => !f.critical);
  const filled = requiredFields.filter((f) => {
    const val = company[f.key];
    if (Array.isArray(val)) return val.length > 0;
    return !!val;
  });

  const hasMsmeDetails = company.msme && !company.udyam_number;
  const hasStartupDetails = company.startup && !company.dpiit_number;

  if (missing.length === 0 && !hasMsmeDetails && !hasStartupDetails) return null;

  return (
    <Card className="p-5 shadow-[var(--shadow-card)] border-warning/30">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-display font-semibold text-foreground text-sm">
            Complete your profile for a stronger proposal
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            The AI uses these details to generate a submission-ready document
          </p>
        </div>
      </div>

      {/* Filled items */}
      {filled.length > 0 && (
        <div className="space-y-1 mb-3">
          {filled.slice(0, 3).map((f) => (
            <div key={f.key} className="flex items-center gap-2 text-xs text-success">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {f.label}
            </div>
          ))}
          {filled.length > 3 && (
            <p className="text-xs text-muted-foreground ml-5">+{filled.length - 3} more filled</p>
          )}
        </div>
      )}

      {/* Critical missing */}
      {criticalMissing.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-destructive mb-1.5">Required for proposal:</p>
          <div className="space-y-1">
            {criticalMissing.map((f) => (
              <div key={f.key} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                {f.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MSME/Startup specific */}
      {(hasMsmeDetails || hasStartupDetails) && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-warning mb-1.5">Recommended:</p>
          {hasMsmeDetails && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-warning" />
              Udyam/MSME Registration Number
            </div>
          )}
          {hasStartupDetails && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-warning" />
              DPIIT Recognition Number
            </div>
          )}
        </div>
      )}

      {/* Optional missing */}
      {optionalMissing.length > 0 && (
        <p className="text-xs text-muted-foreground mb-3">
          +{optionalMissing.length} optional fields can strengthen your proposal
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="accent" size="sm" className="flex-1 gap-1" onClick={onEditProfile}>
          Complete Profile
        </Button>
        <Button variant="ghost" size="sm" className="gap-1" onClick={onProceedAnyway}>
          Skip
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
};

export default MissingInfoCheck;
