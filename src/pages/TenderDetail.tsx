import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WorkspaceHeader from "@/components/WorkspaceHeader";
import { useToast } from "@/hooks/use-toast";
import { useOrg } from "@/contexts/OrganizationContext";
import {
  getTender, updateTender, deleteTender, Tender, TenderStage, TenderPriority, STAGES, PRIORITIES,
} from "@/lib/tenders-api";

const TenderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOrgAdmin } = useOrg();
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Tender>>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getTender(id)
      .then((t) => { setTender(t); setForm(t); })
      .catch((err) => toast({ title: "Failed to load", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [id]);

  const onSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await updateTender(id, {
        title: form.title,
        reference_no: form.reference_no,
        buyer: form.buyer,
        department: form.department,
        category: form.category,
        source_url: form.source_url,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
        emd_amount: form.emd_amount ? Number(form.emd_amount) : null,
        submission_deadline: form.submission_deadline,
        opening_date: form.opening_date,
        stage: form.stage,
        priority: form.priority,
        notes: form.notes,
      });
      setTender(updated);
      toast({ title: "Saved" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!id || !confirm("Delete this tender? This cannot be undone.")) return;
    try {
      await deleteTender(id);
      toast({ title: "Tender deleted" });
      navigate("/tenders");
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <WorkspaceHeader />
        <div className="pt-14 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen bg-background">
        <WorkspaceHeader />
        <div className="pt-14 max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">Tender not found.</p>
          <Button asChild variant="outline"><Link to="/tenders"><ArrowLeft className="w-4 h-4 mr-1.5" /> Back to workspace</Link></Button>
        </div>
      </div>
    );
  }

  const fmtDateInput = (iso: string | null | undefined) =>
    iso ? new Date(iso).toISOString().slice(0, 16) : "";

  return (
    <div className="min-h-screen bg-background">
      <WorkspaceHeader />
      <div className="pt-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/tenders"><ArrowLeft className="w-4 h-4 mr-1.5" /> Workspace</Link>
            </Button>
            <div className="flex items-center gap-2">
              {isOrgAdmin && (
                <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                </Button>
              )}
              <Button onClick={onSave} disabled={saving} variant="accent">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1.5" /> Save</>}
              </Button>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <Input
                value={form.title || ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="text-xl font-display font-bold border-none px-0 focus-visible:ring-0 shadow-none"
              />
              <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                <Badge variant="secondary">{tender.reference_no || "No ref"}</Badge>
                <span>Updated {new Date(tender.updated_at).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Bid details</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Reference no.">
                    <Input value={form.reference_no || ""} onChange={(e) => setForm({ ...form, reference_no: e.target.value })} />
                  </Field>
                  <Field label="Buyer / PSU">
                    <Input value={form.buyer || ""} onChange={(e) => setForm({ ...form, buyer: e.target.value })} />
                  </Field>
                  <Field label="Department">
                    <Input value={form.department || ""} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                  </Field>
                  <Field label="Category">
                    <Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  </Field>
                  <Field label="Estimated value (₹)">
                    <Input type="number" value={form.estimated_value ?? ""} onChange={(e) => setForm({ ...form, estimated_value: e.target.value as any })} />
                  </Field>
                  <Field label="EMD (₹)">
                    <Input type="number" value={form.emd_amount ?? ""} onChange={(e) => setForm({ ...form, emd_amount: e.target.value as any })} />
                  </Field>
                  <Field label="Submission deadline">
                    <Input type="datetime-local" value={fmtDateInput(form.submission_deadline)} onChange={(e) => setForm({ ...form, submission_deadline: e.target.value })} />
                  </Field>
                  <Field label="Opening date">
                    <Input type="datetime-local" value={fmtDateInput(form.opening_date)} onChange={(e) => setForm({ ...form, opening_date: e.target.value })} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Source URL">
                      <div className="flex gap-2">
                        <Input value={form.source_url || ""} onChange={(e) => setForm({ ...form, source_url: e.target.value })} />
                        {form.source_url && (
                          <Button asChild variant="outline" size="icon">
                            <a href={form.source_url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
                          </Button>
                        )}
                      </div>
                    </Field>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
                <CardContent>
                  <Textarea
                    rows={6}
                    value={form.notes || ""}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Internal notes, pre-bid query points, lessons learned…"
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Workflow</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Field label="Stage">
                    <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as TenderStage })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Priority">
                    <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TenderPriority })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">AI Proposal</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Use the analyzer to extract requirements and generate a compliant proposal for this tender.
                  </p>
                  <Button asChild variant="hero" className="w-full">
                    <Link to="/">Open Analyzer</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
    {children}
  </div>
);

export default TenderDetail;
