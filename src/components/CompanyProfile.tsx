import { useState } from "react";
import { Building2, BadgeCheck, Rocket, Pencil, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface CompanyData {
  company_name: string;
  msme: boolean;
  startup: boolean;
}

interface CompanyProfileProps {
  company: CompanyData;
  onEdit: (company: CompanyData) => void;
}

const CompanyProfile = ({ company, onEdit }: CompanyProfileProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(company);

  const handleSave = () => {
    onEdit(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <Card className="p-5 shadow-[var(--shadow-card)]">
        <h3 className="font-display font-semibold text-foreground mb-4">Edit Company Profile</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Company Name</Label>
            <Input
              value={draft.company_name}
              onChange={(e) => setDraft({ ...draft, company_name: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">MSME Registered</Label>
            <Switch checked={draft.msme} onCheckedChange={(v) => setDraft({ ...draft, msme: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Startup Certified</Label>
            <Switch checked={draft.startup} onCheckedChange={(v) => setDraft({ ...draft, startup: v })} />
          </div>
          <Button variant="accent" className="w-full gap-2" onClick={handleSave}>
            <Save className="w-4 h-4" />
            Save Profile
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">{company.company_name}</h3>
            <p className="text-xs text-muted-foreground">Company Profile</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => { setDraft(company); setEditing(true); }}>
          <Pencil className="w-4 h-4" />
        </Button>
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
