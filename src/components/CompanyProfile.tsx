import { Building2, BadgeCheck, Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface CompanyData {
  company_name: string;
  msme: boolean;
  startup: boolean;
}

interface CompanyProfileProps {
  company: CompanyData;
  onEdit: (company: CompanyData) => void;
}

const CompanyProfile = ({ company }: CompanyProfileProps) => {
  return (
    <Card className="p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">{company.company_name}</h3>
          <p className="text-xs text-muted-foreground">Company Profile</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {company.msme && (
          <Badge variant="secondary" className="gap-1.5">
            <BadgeCheck className="w-3.5 h-3.5 text-success" />
            MSME Registered
          </Badge>
        )}
        {company.startup && (
          <Badge variant="secondary" className="gap-1.5">
            <Rocket className="w-3.5 h-3.5 text-info" />
            Startup Certified
          </Badge>
        )}
      </div>
    </Card>
  );
};

export default CompanyProfile;
