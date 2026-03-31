import { useState } from "react";
import { Building2, BadgeCheck, Rocket, Pencil, Save, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface CompanyData {
  company_name: string;
  msme: boolean;
  startup: boolean;
  pan: string;
  tan: string;
  gst: string;
  cin: string;
  dpiit_number: string;
  udyam_number: string;
  address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  annual_turnover: string;
  years_experience: string;
  employees_count: string;
  certifications: string[];
  past_projects: string[];
  bank_name: string;
  bank_account: string;
  ifsc_code: string;
}

export const DEFAULT_COMPANY: CompanyData = {
  company_name: "Tuno Tech",
  msme: true,
  startup: true,
  pan: "",
  tan: "",
  gst: "",
  cin: "",
  dpiit_number: "",
  udyam_number: "",
  address: "",
  contact_person: "",
  contact_email: "",
  contact_phone: "",
  annual_turnover: "",
  years_experience: "",
  employees_count: "",
  certifications: [],
  past_projects: [],
  bank_name: "",
  bank_account: "",
  ifsc_code: "",
};

interface CompanyProfileProps {
  company: CompanyData;
  onEdit: (company: CompanyData) => void;
}

const fieldGroups = [
  {
    title: "Basic Information",
    fields: [
      { key: "company_name", label: "Company Name", required: true },
      { key: "contact_person", label: "Contact Person" },
      { key: "contact_email", label: "Email" },
      { key: "contact_phone", label: "Phone" },
      { key: "address", label: "Registered Address", multiline: true },
    ],
  },
  {
    title: "Registration & Tax",
    fields: [
      { key: "pan", label: "PAN Number", placeholder: "ABCDE1234F" },
      { key: "tan", label: "TAN Number", placeholder: "ABCD12345E" },
      { key: "gst", label: "GST Number", placeholder: "22AAAAA0000A1Z5" },
      { key: "cin", label: "CIN Number", placeholder: "U12345MH2020PTC123456" },
      { key: "udyam_number", label: "Udyam / MSME Number", placeholder: "UDYAM-XX-00-0000000" },
      { key: "dpiit_number", label: "DPIIT Recognition No.", placeholder: "DIPP12345" },
    ],
  },
  {
    title: "Experience & Capacity",
    fields: [
      { key: "years_experience", label: "Years of Experience", placeholder: "e.g. 5 years" },
      { key: "annual_turnover", label: "Annual Turnover", placeholder: "e.g. ₹2 Crore" },
      { key: "employees_count", label: "Number of Employees", placeholder: "e.g. 50" },
    ],
  },
  {
    title: "Banking Details",
    fields: [
      { key: "bank_name", label: "Bank Name" },
      { key: "bank_account", label: "Account Number" },
      { key: "ifsc_code", label: "IFSC Code" },
    ],
  },
];

const CompanyProfile = ({ company, onEdit }: CompanyProfileProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(company);
  const [newCert, setNewCert] = useState("");
  const [newProject, setNewProject] = useState("");

  const handleSave = () => {
    onEdit(draft);
    setEditing(false);
  };

  const updateField = (key: string, value: string) => {
    setDraft({ ...draft, [key]: value } as any);
  };

  const addCertification = () => {
    if (newCert.trim()) {
      setDraft({ ...draft, certifications: [...draft.certifications, newCert.trim()] });
      setNewCert("");
    }
  };

  const removeCert = (i: number) => {
    setDraft({ ...draft, certifications: draft.certifications.filter((_, idx) => idx !== i) });
  };

  const addProject = () => {
    if (newProject.trim()) {
      setDraft({ ...draft, past_projects: [...draft.past_projects, newProject.trim()] });
      setNewProject("");
    }
  };

  const removeProject = (i: number) => {
    setDraft({ ...draft, past_projects: draft.past_projects.filter((_, idx) => idx !== i) });
  };

  const filledFields = [
    company.pan, company.tan, company.gst, company.cin,
    company.annual_turnover, company.years_experience,
    company.contact_person, company.address,
  ].filter(Boolean).length;

  if (editing) {
    return (
      <Card className="p-5 shadow-[var(--shadow-card)] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-foreground">Edit Company Profile</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
        </div>

        <div className="space-y-6">
          {/* Toggle switches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">MSME Registered</Label>
              <Switch checked={draft.msme} onCheckedChange={(v) => setDraft({ ...draft, msme: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">DPIIT Startup</Label>
              <Switch checked={draft.startup} onCheckedChange={(v) => setDraft({ ...draft, startup: v })} />
            </div>
          </div>

          {/* Field groups */}
          {fieldGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-3">{group.title}</p>
              <div className="space-y-3">
                {group.fields.map((field) => (
                  <div key={field.key}>
                    <Label className="text-xs text-muted-foreground">
                      {field.label}
                      {(field as any).required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {(field as any).multiline ? (
                      <Textarea
                        value={(draft as any)[field.key] || ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={(field as any).placeholder || ""}
                        className="mt-1 text-sm"
                        rows={2}
                      />
                    ) : (
                      <Input
                        value={(draft as any)[field.key] || ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={(field as any).placeholder || ""}
                        className="mt-1 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Certifications */}
          <div>
            <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-3">Certifications</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {draft.certifications.map((c, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {c}
                  <button onClick={() => removeCert(i)} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newCert} onChange={(e) => setNewCert(e.target.value)} placeholder="e.g. ISO 27001, ISO 9001" className="text-sm" onKeyDown={(e) => e.key === "Enter" && addCertification()} />
              <Button variant="outline" size="sm" onClick={addCertification}><Plus className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Past Projects */}
          <div>
            <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-3">Past Projects / Experience</p>
            <div className="space-y-2 mb-2">
              {draft.past_projects.map((p, i) => (
                <div key={i} className="flex items-start gap-2 bg-muted rounded-md p-2">
                  <span className="text-xs text-muted-foreground flex-1">{p}</span>
                  <button onClick={() => removeProject(i)} className="hover:text-destructive flex-shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newProject} onChange={(e) => setNewProject(e.target.value)} placeholder="Describe a past project..." className="text-sm" onKeyDown={(e) => e.key === "Enter" && addProject()} />
              <Button variant="outline" size="sm" onClick={addProject}><Plus className="w-4 h-4" /></Button>
            </div>
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
            <p className="text-xs text-muted-foreground">{filledFields}/8 details filled</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => { setDraft(company); setEditing(true); }}>
          <Pencil className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {company.msme && (
          <Badge variant="secondary" className="gap-1.5">
            <BadgeCheck className="w-3.5 h-3.5 text-success" />
            MSME
          </Badge>
        )}
        {company.startup && (
          <Badge variant="secondary" className="gap-1.5">
            <Rocket className="w-3.5 h-3.5 text-info" />
            Startup
          </Badge>
        )}
        {company.certifications.map((c, i) => (
          <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
        ))}
      </div>

      {/* Quick info */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        {company.pan && <p><span className="font-medium text-foreground">PAN:</span> {company.pan}</p>}
        {company.gst && <p><span className="font-medium text-foreground">GST:</span> {company.gst}</p>}
        {company.annual_turnover && <p><span className="font-medium text-foreground">Turnover:</span> {company.annual_turnover}</p>}
        {company.years_experience && <p><span className="font-medium text-foreground">Experience:</span> {company.years_experience}</p>}
      </div>

      {filledFields < 4 && (
        <button
          onClick={() => { setDraft(company); setEditing(true); }}
          className="mt-3 w-full rounded-lg border border-dashed border-accent/30 bg-accent/5 p-2.5 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
        >
          ⚡ Complete your profile for better proposals
        </button>
      )}
    </Card>
  );
};

export default CompanyProfile;
