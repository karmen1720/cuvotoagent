import { useState } from "react";
import { Settings2, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface CriteriaConfig {
  min_turnover: string;
  min_experience: string;
  require_msme: boolean;
  require_iso: boolean;
  max_submission_days: string;
  require_emd_exemption: boolean;
  custom_criteria: string;
}

export const DEFAULT_CRITERIA: CriteriaConfig = {
  min_turnover: "",
  min_experience: "",
  require_msme: false,
  require_iso: false,
  max_submission_days: "",
  require_emd_exemption: false,
  custom_criteria: "",
};

interface EligibilityCriteriaProps {
  criteria: CriteriaConfig;
  onSave: (criteria: CriteriaConfig) => void;
}

const EligibilityCriteria = ({ criteria, onSave }: EligibilityCriteriaProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(criteria);

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  if (!editing) {
    return (
      <Card className="p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-accent" />
            Eligibility Criteria
          </h3>
          <Button variant="ghost" size="sm" onClick={() => { setDraft(criteria); setEditing(true); }}>
            Configure
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Set your minimum criteria to auto-filter tenders before analysis.
        </p>
        {(criteria.min_turnover || criteria.min_experience) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {criteria.min_turnover && (
              <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                Turnover: {criteria.min_turnover}
              </span>
            )}
            {criteria.min_experience && (
              <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                Exp: {criteria.min_experience}
              </span>
            )}
            {criteria.require_msme && (
              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">MSME Only</span>
            )}
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
        <Settings2 className="w-4 h-4 text-accent" />
        Set Eligibility Criteria
      </h3>
      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground">Minimum Turnover (e.g. ₹1 Crore)</Label>
          <Input value={draft.min_turnover} onChange={(e) => setDraft({ ...draft, min_turnover: e.target.value })} className="mt-1 text-sm" placeholder="₹1 Crore" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Minimum Experience (e.g. 3 years)</Label>
          <Input value={draft.min_experience} onChange={(e) => setDraft({ ...draft, min_experience: e.target.value })} className="mt-1 text-sm" placeholder="3 years" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Min Days Until Deadline</Label>
          <Input value={draft.max_submission_days} onChange={(e) => setDraft({ ...draft, max_submission_days: e.target.value })} className="mt-1 text-sm" placeholder="e.g. 7" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Only MSME-eligible tenders</Label>
            <Switch checked={draft.require_msme} onCheckedChange={(v) => setDraft({ ...draft, require_msme: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Require ISO certification</Label>
            <Switch checked={draft.require_iso} onCheckedChange={(v) => setDraft({ ...draft, require_iso: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">EMD exemption available</Label>
            <Switch checked={draft.require_emd_exemption} onCheckedChange={(v) => setDraft({ ...draft, require_emd_exemption: v })} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="accent" size="sm" className="flex-1 gap-1" onClick={handleSave}>
            <Save className="w-4 h-4" />
            Save Criteria
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    </Card>
  );
};

export default EligibilityCriteria;
