import { motion } from "framer-motion";
import { FileSearch, CheckCircle2, XCircle, AlertCircle, ShieldCheck, FileText, AlertTriangle, Scale, ClipboardList, Package, HelpCircle } from "lucide-react";
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
  requirements: TenderRequirements & Record<string, any>;
}

const RequirementsDisplay = ({ requirements }: RequirementsDisplayProps) => {
  const exec = requirements.executive_summary;
  const eligMap = requirements.eligibility_mapping as any[] | undefined;
  const compliance = requirements.compliance_exemptions;
  const boq = requirements.boq_analysis;
  const docChecklist = requirements.document_checklist as any[] | undefined;
  const riskAssessment = requirements.risk_assessment;

  return (
    <div className="space-y-5">
      {/* A. Executive Tender Summary */}
      {exec && (
        <Card className="p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground text-lg mb-3 flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-accent" />
            Executive Tender Summary
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{exec.summary}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Tender ID", value: exec.tender_id },
              { label: "Issuing Authority", value: exec.issuing_authority },
              { label: "Tender Type", value: exec.tender_type },
              { label: "Estimated Value", value: exec.estimated_value },
              { label: "EMD", value: exec.emd_amount },
              { label: "Tender Fee", value: exec.tender_fee },
              { label: "Submission Deadline", value: exec.submission_deadline },
              { label: "Bid Opening", value: exec.bid_opening_date },
              { label: "Pre-Bid Meeting", value: exec.pre_bid_date },
              { label: "Bid Validity", value: exec.bid_validity },
            ]
              .filter((f) => f.value && f.value !== "Not specified in document")
              .map((f, i) => (
                <div key={i} className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{f.value}</p>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* B. Eligibility Mapping Table */}
      {eligMap && eligMap.length > 0 && (
        <Card className="p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground text-lg mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            Eligibility Mapping
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left py-2 pr-3">Requirement</th>
                  <th className="text-left py-2 pr-3">Tender Asks</th>
                  <th className="text-left py-2 pr-3">Company Status</th>
                  <th className="text-left py-2">Gap / Action</th>
                </tr>
              </thead>
              <tbody>
                {eligMap.map((row: any, i: number) => {
                  const isCompliant = row.gap_action?.toLowerCase().includes("compliant") && !row.gap_action?.toLowerCase().includes("non-compliant");
                  return (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-border/50"
                    >
                      <td className="py-2.5 pr-3 font-medium text-foreground">{row.requirement}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{row.tender_asks}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{row.company_status}</td>
                      <td className="py-2.5">
                        <Badge variant={isCompliant ? "default" : "destructive"} className="text-xs">
                          {isCompliant ? "✓ Compliant" : "⚠ Action Required"}
                        </Badge>
                        {!isCompliant && <p className="text-xs text-muted-foreground mt-1">{row.gap_action}</p>}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* C. Indian Government Compliance & Exemptions */}
      {compliance && (
        <Card className="p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground text-lg mb-3 flex items-center gap-2">
            <Scale className="w-5 h-5 text-accent" />
            Compliance & Exemptions
          </h3>
          <div className="space-y-3">
            {[
              { label: "MSME / Startup India", detail: compliance.msme_analysis, icon: CheckCircle2, color: "text-success" },
              { label: "Startup (DPIIT)", detail: compliance.startup_analysis, icon: CheckCircle2, color: "text-info" },
              { label: "Make in India (PPP-MII)", detail: compliance.make_in_india, icon: ShieldCheck, color: "text-accent" },
              { label: "Rule 144(xi) GFR", detail: compliance.rule_144_xi, icon: AlertCircle, color: "text-warning" },
            ]
              .filter((c) => c.detail)
              .map((c, i) => (
                <div key={i} className="rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <c.icon className={`w-4 h-4 ${c.color}`} />
                    <p className="text-sm font-semibold text-foreground">{c.label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.detail}</p>
                </div>
              ))}
            {compliance.other_exemptions && compliance.other_exemptions.length > 0 && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-semibold text-foreground mb-1">Other Exemptions</p>
                <ul className="space-y-1">
                  {compliance.other_exemptions.map((e: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* D. Critical Deliverables & BOQ Analysis */}
      {boq && (
        <Card className="p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground text-lg mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" />
            Deliverables & BOQ Analysis
          </h3>
          {boq.scope_items && boq.scope_items.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-foreground mb-1.5">Scope of Work</p>
              <ul className="space-y-1">
                {boq.scope_items.map((item: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {boq.restrictive_specs && boq.restrictive_specs.length > 0 && (
            <div className="mb-3 rounded-lg bg-warning/10 p-3">
              <p className="text-xs font-semibold text-warning mb-1.5">⚠ Restrictive Specifications</p>
              <ul className="space-y-1">
                {boq.restrictive_specs.map((s: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground">{s}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Payment Terms", value: boq.payment_terms },
              { label: "PBG Requirement", value: boq.pbg_requirement },
              { label: "Warranty / AMC", value: boq.warranty_amc },
              { label: "Penalties / LD", value: boq.penalties_ld },
            ]
              .filter((f) => f.value)
              .map((f, i) => (
                <div key={i} className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p className="text-xs font-medium text-foreground mt-0.5">{f.value}</p>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* E. Document Checklist */}
      {docChecklist && docChecklist.length > 0 && (
        <Card className="p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground text-lg mb-3 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-accent" />
            Document Checklist
          </h3>
          <div className="space-y-1.5">
            {docChecklist.map((doc: any, i: number) => (
              <div key={i} className="flex items-center gap-3 rounded-md bg-muted p-2.5">
                {doc.status === "Available" ? (
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                ) : doc.status === "Not Available" ? (
                  <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
                )}
                <span className="text-sm text-foreground flex-1">{doc.document}</span>
                <div className="flex items-center gap-2">
                  {doc.mandatory && <Badge variant="destructive" className="text-[10px]">Required</Badge>}
                  <span className="text-xs text-muted-foreground">{doc.status || "To Be Arranged"}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* F. Risk Assessment & Pre-Bid Queries */}
      {riskAssessment && (
        <Card className="p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground text-lg mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Risk Assessment & Strategic Action
          </h3>
          {riskAssessment.risk_factors && riskAssessment.risk_factors.length > 0 && (
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 mb-3">
              <p className="text-xs font-semibold text-destructive mb-1.5">Risk Factors</p>
              <ul className="space-y-1">
                {riskAssessment.risk_factors.map((r: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {riskAssessment.pre_bid_queries && riskAssessment.pre_bid_queries.length > 0 && (
            <div className="rounded-lg bg-info/5 border border-info/20 p-3 mb-3">
              <p className="text-xs font-semibold text-info mb-1.5 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Suggested Pre-Bid Queries
              </p>
              <ol className="space-y-1.5 list-decimal list-inside">
                {riskAssessment.pre_bid_queries.map((q: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground">{q}</li>
                ))}
              </ol>
            </div>
          )}
          {riskAssessment.strategic_notes && riskAssessment.strategic_notes.length > 0 && (
            <div className="rounded-lg bg-success/5 border border-success/20 p-3">
              <p className="text-xs font-semibold text-success mb-1.5">Strategic Action Items</p>
              <ul className="space-y-1">
                {riskAssessment.strategic_notes.map((n: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Technical Criteria (if present) */}
      {requirements.technical_criteria && requirements.technical_criteria.length > 0 && (
        <Card className="p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground text-lg mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            Technical Evaluation Criteria
          </h3>
          <div className="space-y-2">
            {requirements.technical_criteria.map((tc: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-md bg-muted p-2.5">
                <span className="text-sm text-foreground">{tc.criterion}</span>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {tc.max_marks && <span>Max: {tc.max_marks}</span>}
                  {tc.minimum_required && <span className="text-accent">Min: {tc.minimum_required}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Legacy: Required Documents, MSME/Startup Benefits */}
      {(!exec) && (
        <Card className="p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-accent" />
            Extracted Requirements
          </h3>
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
          <div className="space-y-4">
            {[
              { title: "Required Documents", items: requirements.documents, icon: FileSearch, color: "text-info", bg: "bg-info/10" },
              { title: "MSME Benefits", items: requirements.msme_benefits, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
              { title: "Startup Benefits", items: requirements.startup_benefits, icon: AlertCircle, color: "text-accent", bg: "bg-accent/10" },
            ].map((section, i) => (
              <div key={i}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-md ${section.bg} flex items-center justify-center`}>
                    <section.icon className={`w-3.5 h-3.5 ${section.color}`} />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{section.title}</p>
                  <Badge variant="secondary" className="text-xs">{section.items?.length || 0}</Badge>
                </div>
                <ul className="space-y-1.5 ml-8">
                  {(section.items || []).map((item: string, j: number) => (
                    <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                  {(!section.items || section.items.length === 0) && (
                    <li className="text-sm text-muted-foreground italic">None specified</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default RequirementsDisplay;
