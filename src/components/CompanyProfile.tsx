import { useState } from "react";
import { Building2, BadgeCheck, Rocket, Pencil, Save, Plus, X, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validate, expiryStatus } from "@/lib/indian-validators";

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
  authorized_signatory_name: string;
  authorized_signatory_designation: string;
  office_city: string;
  local_content_percentage: string;
  escalation_l1_name: string;
  escalation_l1_email: string;
  escalation_l2_name: string;
  escalation_l2_email: string;
  escalation_l3_name: string;
  escalation_l3_email: string;
  support_phone: string;
  support_email: string;
  nature_of_business: string;
  year_of_incorporation: string;
  // Expanded India tender fields
  turnover_y1: string;
  turnover_y2: string;
  turnover_y3: string;
  net_worth: string;
  gem_seller_id: string;
  nsic_number: string;
  duns_number: string;
  iso_number: string;
  iso_expiry: string;
  bis_number: string;
  stqc_number: string;
  bee_rating: string;
  epf_code: string;
  esic_code: string;
  additional_gsts: string[];
  business_type: string;
  dsc_expiry: string;
  dd_bank: string;
  dd_favouring: string;
  mii_class: string;
  land_border_equity: boolean;
  subletting_allowed: boolean;
  office_state: string;
}

export const DEFAULT_COMPANY: CompanyData = {
  company_name: "",
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
  authorized_signatory_name: "",
  authorized_signatory_designation: "",
  office_city: "",
  local_content_percentage: "100",
  escalation_l1_name: "",
  escalation_l1_email: "",
  escalation_l2_name: "",
  escalation_l2_email: "",
  escalation_l3_name: "",
  escalation_l3_email: "",
  support_phone: "",
  support_email: "",
  nature_of_business: "",
  year_of_incorporation: "",
  turnover_y1: "",
  turnover_y2: "",
  turnover_y3: "",
  net_worth: "",
  gem_seller_id: "",
  nsic_number: "",
  duns_number: "",
  iso_number: "",
  iso_expiry: "",
  bis_number: "",
  stqc_number: "",
  bee_rating: "",
  epf_code: "",
  esic_code: "",
  additional_gsts: [],
  business_type: "",
  dsc_expiry: "",
  dd_bank: "",
  dd_favouring: "",
  mii_class: "Class-I",
  land_border_equity: false,
  subletting_allowed: false,
  office_state: "",
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
      { key: "business_type", label: "Business Type", placeholder: "Proprietorship / Partnership / LLP / Pvt Ltd / Public Ltd" },
      { key: "nature_of_business", label: "Nature of Business", placeholder: "e.g. IT Services, Software Development" },
      { key: "year_of_incorporation", label: "Year of Incorporation", placeholder: "e.g. 2020" },
      { key: "address", label: "Registered Address", multiline: true },
      { key: "office_city", label: "Office City", placeholder: "e.g. Mumbai" },
      { key: "office_state", label: "Office State", placeholder: "e.g. Maharashtra" },
    ],
  },
  {
    title: "Authorized Signatory",
    fields: [
      { key: "authorized_signatory_name", label: "Signatory Name", required: true, placeholder: "Full name of authorized person" },
      { key: "authorized_signatory_designation", label: "Designation", placeholder: "e.g. Director, CEO" },
      { key: "contact_person", label: "Contact Person" },
      { key: "contact_email", label: "Email" },
      { key: "contact_phone", label: "Phone" },
      { key: "dsc_expiry", label: "Digital Signature (DSC) Expiry", placeholder: "DD/MM/YYYY" },
    ],
  },
  {
    title: "Registration & Tax",
    fields: [
      { key: "pan", label: "PAN Number", placeholder: "ABCDE1234F" },
      { key: "tan", label: "TAN Number", placeholder: "ABCD12345E" },
      { key: "gst", label: "Primary GST Number", placeholder: "22AAAAA0000A1Z5" },
      { key: "cin", label: "CIN Number", placeholder: "U12345MH2020PTC123456" },
      { key: "udyam_number", label: "Udyam / MSME Number", placeholder: "UDYAM-XX-00-0000000" },
      { key: "dpiit_number", label: "DPIIT Recognition No.", placeholder: "DIPP12345" },
      { key: "nsic_number", label: "NSIC Registration Number", placeholder: "Optional" },
      { key: "gem_seller_id", label: "GeM Seller ID", placeholder: "Required for GeM tenders" },
      { key: "duns_number", label: "DUNS Number", placeholder: "9 digits — for World Bank/ADB" },
    ],
  },
  {
    title: "Certifications & Standards",
    fields: [
      { key: "iso_number", label: "ISO Certificate Number", placeholder: "e.g. ISO 9001:2015 / 27001" },
      { key: "iso_expiry", label: "ISO Expiry Date", placeholder: "DD/MM/YYYY" },
      { key: "bis_number", label: "BIS License No.", placeholder: "Required for electronics" },
      { key: "stqc_number", label: "STQC Certificate No.", placeholder: "For govt IT tenders" },
      { key: "bee_rating", label: "BEE Star Rating", placeholder: "1-5" },
    ],
  },
  {
    title: "Labour Compliance",
    fields: [
      { key: "epf_code", label: "EPF Establishment Code", placeholder: "Required for service tenders" },
      { key: "esic_code", label: "ESIC Establishment Code" },
    ],
  },
  {
    title: "Experience & Capacity",
    fields: [
      { key: "years_experience", label: "Years of Experience", placeholder: "e.g. 5 years" },
      { key: "annual_turnover", label: "Annual Turnover (current)", placeholder: "e.g. ₹2 Crore" },
      { key: "turnover_y1", label: "Turnover FY-1 (latest)", placeholder: "₹ in Crore" },
      { key: "turnover_y2", label: "Turnover FY-2", placeholder: "₹ in Crore" },
      { key: "turnover_y3", label: "Turnover FY-3", placeholder: "₹ in Crore" },
      { key: "net_worth", label: "Net Worth (Audited)", placeholder: "₹ in Crore" },
      { key: "employees_count", label: "Number of Employees", placeholder: "e.g. 50" },
      { key: "local_content_percentage", label: "Make in India Local Content %", placeholder: "100" },
      { key: "mii_class", label: "MII Classification", placeholder: "Class-I / Class-II / Non-local" },
    ],
  },
  {
    title: "EMD / DD Details",
    fields: [
      { key: "dd_bank", label: "Preferred DD Bank", placeholder: "e.g. SBI Main Branch" },
      { key: "dd_favouring", label: "DD Favouring (default)", placeholder: "Often the issuing authority" },
    ],
  },
  {
    title: "Escalation Matrix",
    fields: [
      { key: "escalation_l1_name", label: "Level 1 - Name & Role", placeholder: "e.g. Ajay Kumar - Project Expert" },
      { key: "escalation_l1_email", label: "Level 1 - Email" },
      { key: "escalation_l2_name", label: "Level 2 - Name & Role" },
      { key: "escalation_l2_email", label: "Level 2 - Email" },
      { key: "escalation_l3_name", label: "Level 3 - Name & Role" },
      { key: "escalation_l3_email", label: "Level 3 - Email" },
    ],
  },
  {
    title: "Support Centre",
    fields: [
      { key: "support_phone", label: "Support Phone", placeholder: "+91-XXXXXXXXXX" },
      { key: "support_email", label: "Support Email", placeholder: "support@company.com" },
    ],
  },
  {
    title: "Banking Details",
    fields: [
      { key: "bank_name", label: "Bank Name" },
      { key: "bank_account", label: "Account Number" },
      { key: "ifsc_code", label: "IFSC Code", placeholder: "SBIN0001234" },
    ],
  },
];

const CompanyProfile = ({ company, onEdit }: CompanyProfileProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(company);
  const [newCert, setNewCert] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newGst, setNewGst] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isWarningOnly = (key: string, msg: string) =>
    (key === "dsc_expiry" || key === "iso_expiry") && msg.startsWith("⚠");

  const handleSave = () => {
    // Validate all fields with regex
    const newErrors: Record<string, string> = {};
    const blocking: Record<string, string> = {};
    for (const grp of fieldGroups) {
      for (const f of grp.fields) {
        const err = validate(f.key, (draft as any)[f.key] || "");
        if (err) {
          newErrors[f.key] = err;
          if (!isWarningOnly(f.key, err)) blocking[f.key] = err;
        }
      }
    }
    setErrors(newErrors);
    if (Object.keys(blocking).length > 0) return;
    onEdit(draft);
    setEditing(false);
  };

  const updateField = (key: string, value: string) => {
    setDraft({ ...draft, [key]: value } as any);
    if (errors[key]) {
      const updated = { ...errors };
      delete updated[key];
      setErrors(updated);
    }
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

  const addGst = () => {
    const v = newGst.trim().toUpperCase();
    const err = validate("gst", v);
    if (err) {
      setErrors({ ...errors, additional_gsts: err });
      return;
    }
    setDraft({ ...draft, additional_gsts: [...(draft.additional_gsts || []), v] });
    setNewGst("");
    const updated = { ...errors };
    delete updated.additional_gsts;
    setErrors(updated);
  };

  const removeGst = (i: number) => {
    setDraft({ ...draft, additional_gsts: (draft.additional_gsts || []).filter((_, idx) => idx !== i) });
  };

  const allFields = fieldGroups.flatMap((g) => g.fields.map((f) => f.key));
  const filledFields = allFields.filter((k) => (company as any)[k] && String((company as any)[k]).trim()).length;
  const completeness = Math.round((filledFields / allFields.length) * 100);

  if (editing) {
    return (
      <Card className="p-5 shadow-[var(--shadow-card)] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-foreground">Edit Company Profile</h3>
          <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setErrors({}); }}>Cancel</Button>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/30 p-3">
            <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Please fix {Object.keys(errors).length} validation error(s) before saving
            </p>
          </div>
        )}

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
            <div className="flex items-center justify-between">
              <Label className="text-sm">Foreign equity &gt; 51% from land-border country (Rule 144(xi))</Label>
              <Switch checked={draft.land_border_equity} onCheckedChange={(v) => setDraft({ ...draft, land_border_equity: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Will rely on subcontractor / partner for delivery</Label>
              <Switch checked={draft.subletting_allowed} onCheckedChange={(v) => setDraft({ ...draft, subletting_allowed: v })} />
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
                        className={`mt-1 text-sm ${errors[field.key] ? (isWarningOnly(field.key, errors[field.key]) ? "border-yellow-500" : "border-destructive") : ""}`}
                      />
                    )}
                    {errors[field.key] && (
                      <p className={`text-xs mt-1 ${isWarningOnly(field.key, errors[field.key]) ? "text-yellow-600 dark:text-yellow-500" : "text-destructive"}`}>{errors[field.key]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Additional GSTs */}
          <div>
            <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-3">Additional State GST Registrations</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {(draft.additional_gsts || []).map((g, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {g}
                  <button onClick={() => removeGst(i)} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newGst} onChange={(e) => setNewGst(e.target.value)} placeholder="22AAAAA0000A1Z5" className="text-sm" />
              <Button variant="outline" size="sm" onClick={addGst}><Plus className="w-4 h-4" /></Button>
            </div>
            {errors.additional_gsts && <p className="text-xs text-destructive mt-1">{errors.additional_gsts}</p>}
          </div>

          {/* Certifications */}
          <div>
            <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-3">Other Certifications</p>
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
              <Input value={newCert} onChange={(e) => setNewCert(e.target.value)} placeholder="e.g. CMMI L3, NABL" className="text-sm" onKeyDown={(e) => e.key === "Enter" && addCertification()} />
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
            <h3 className="font-display font-semibold text-foreground">{company.company_name || "Your Company"}</h3>
            <p className="text-xs text-muted-foreground">{completeness}% complete · {filledFields}/{allFields.length} fields</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => { setDraft(company); setEditing(true); }}>
          <Pencil className="w-4 h-4" />
        </Button>
      </div>

      {/* Completeness bar */}
      <div className="h-1.5 w-full rounded-full bg-muted mb-3 overflow-hidden">
        <div className="h-full bg-accent transition-all" style={{ width: `${completeness}%` }} />
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
        {company.gem_seller_id && <Badge variant="outline" className="text-xs">GeM ID Set</Badge>}
        {company.nsic_number && <Badge variant="outline" className="text-xs">NSIC</Badge>}
        {company.iso_number && <Badge variant="outline" className="text-xs">ISO</Badge>}
        {company.certifications.map((c, i) => (
          <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
        ))}
      </div>

      {/* Quick info */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        {company.pan && <p><span className="font-medium text-foreground">PAN:</span> {company.pan}</p>}
        {company.gst && <p><span className="font-medium text-foreground">GST:</span> {company.gst}</p>}
        {company.business_type && <p><span className="font-medium text-foreground">Type:</span> {company.business_type}</p>}
        {(company.turnover_y1 || company.annual_turnover) && (
          <p><span className="font-medium text-foreground">Turnover:</span> {company.turnover_y1 || company.annual_turnover}</p>
        )}
        {company.years_experience && <p><span className="font-medium text-foreground">Experience:</span> {company.years_experience}</p>}
        {company.authorized_signatory_name && <p><span className="font-medium text-foreground">Signatory:</span> {company.authorized_signatory_name}</p>}
      </div>

      {completeness < 60 && (
        <button
          onClick={() => { setDraft(company); setEditing(true); }}
          className="mt-3 w-full rounded-lg border border-dashed border-accent/30 bg-accent/5 p-2.5 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
        >
          ⚡ Complete your profile — fill ALL details once, use for every tender
        </button>
      )}
    </Card>
  );
};

export default CompanyProfile;
