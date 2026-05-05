import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Plus, Search, AlertTriangle, IndianRupee, Calendar, TrendingUp, LayoutGrid, List as ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import WorkspaceHeader from "@/components/WorkspaceHeader";
import { useOrg } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  listTenders, createTender, updateTender, Tender, TenderStage, TenderPriority, STAGES, PRIORITIES,
} from "@/lib/tenders-api";

const stageColor: Record<TenderStage, string> = {
  new: "bg-muted text-foreground",
  screening: "bg-blue-500/15 text-blue-500",
  bid_prep: "bg-amber-500/15 text-amber-500",
  submitted: "bg-purple-500/15 text-purple-500",
  won: "bg-green-500/15 text-green-500",
  lost: "bg-red-500/15 text-red-500",
  dropped: "bg-muted text-muted-foreground",
};

const priorityColor: Record<TenderPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/15 text-blue-500",
  high: "bg-amber-500/15 text-amber-500",
  urgent: "bg-red-500/15 text-red-500",
};

const fmtINR = (v: number | null) =>
  v == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

const daysUntil = (iso: string | null) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
};

const Tenders = () => {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<TenderStage | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);

  const refresh = async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      setTenders(await listTenders(currentOrg.id));
    } catch (err: any) {
      toast({ title: "Failed to load tenders", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [currentOrg?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tenders.filter((t) => {
      if (stageFilter !== "all" && t.stage !== stageFilter) return false;
      if (!q) return true;
      return [t.title, t.reference_no, t.buyer, t.department, t.category]
        .some((f) => (f || "").toLowerCase().includes(q));
    });
  }, [tenders, search, stageFilter]);

  const stats = useMemo(() => {
    const active = tenders.filter((t) => !["won", "lost", "dropped"].includes(t.stage));
    const dueSoon = active.filter((t) => {
      const d = daysUntil(t.submission_deadline);
      return d != null && d >= 0 && d <= 7;
    });
    const pipelineValue = active.reduce((sum, t) => sum + (t.estimated_value || 0), 0);
    const won = tenders.filter((t) => t.stage === "won");
    const wonValue = won.reduce((sum, t) => sum + (t.estimated_value || 0), 0);
    const winRate = tenders.length
      ? Math.round((won.length / tenders.filter((t) => ["won", "lost"].includes(t.stage)).length || 0) * 100)
      : 0;
    return { active: active.length, dueSoon: dueSoon.length, pipelineValue, wonValue, winRate: Number.isFinite(winRate) ? winRate : 0 };
  }, [tenders]);

  const onStageChange = async (tender: Tender, newStage: TenderStage) => {
    try {
      const updated = await updateTender(tender.id, { stage: newStage });
      setTenders((prev) => prev.map((t) => (t.id === tender.id ? updated : t)));
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <WorkspaceHeader />
      <div className="pt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Hero */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold">Tender Workspace</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {currentOrg?.name} · Track every opportunity from discovery to award.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center rounded-lg border border-border p-0.5">
                <button
                  onClick={() => setView("kanban")}
                  className={`px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1.5 ${view === "kanban" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Kanban
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1.5 ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                >
                  <ListIcon className="w-3.5 h-3.5" /> List
                </button>
              </div>
              <CreateTenderDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreated={(t) => { setTenders((prev) => [t, ...prev]); setCreateOpen(false); }}
                orgId={currentOrg?.id || ""}
                userId={user?.id || ""}
              />
            </div>
          </div>

          {/* Widgets */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Active tenders" value={String(stats.active)} />
            <StatCard
              icon={<Calendar className="w-4 h-4" />}
              label="Due in 7 days"
              value={String(stats.dueSoon)}
              tone={stats.dueSoon > 0 ? "warning" : "default"}
            />
            <StatCard icon={<IndianRupee className="w-4 h-4" />} label="Pipeline value" value={fmtINR(stats.pipelineValue)} />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Win rate" value={`${stats.winRate}%`} />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, buyer, ref no…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as any)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {STAGES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : tenders.length === 0 ? (
            <EmptyState onCreate={() => setCreateOpen(true)} />
          ) : view === "kanban" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {STAGES.map((s) => {
                const items = filtered.filter((t) => t.stage === s.id);
                return (
                  <div key={s.id} className="rounded-lg border border-border bg-card/50 p-3 min-h-[200px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</span>
                      <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {items.map((t) => (
                        <KanbanCard key={t.id} tender={t} onStageChange={onStageChange} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t) => {
                      const dd = daysUntil(t.submission_deadline);
                      return (
                        <TableRow key={t.id} className="cursor-pointer">
                          <TableCell>
                            <Link to={`/tenders/${t.id}`} className="font-medium hover:text-accent">
                              {t.title}
                            </Link>
                            {t.reference_no && (
                              <div className="text-xs text-muted-foreground">{t.reference_no}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{t.buyer || "—"}</TableCell>
                          <TableCell>
                            <Badge className={stageColor[t.stage]} variant="secondary">
                              {STAGES.find((s) => s.id === t.stage)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={priorityColor[t.priority]} variant="secondary">
                              {t.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {t.submission_deadline ? (
                              <span className={dd != null && dd <= 7 ? "text-amber-500" : ""}>
                                {new Date(t.submission_deadline).toLocaleDateString("en-IN")}
                                {dd != null && dd >= 0 && <span className="text-xs text-muted-foreground"> · {dd}d</span>}
                              </span>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm">{fmtINR(t.estimated_value)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, tone = "default" }: { icon: React.ReactNode; label: string; value: string; tone?: "default" | "warning" }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        {icon} {label}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-display font-bold ${tone === "warning" ? "text-amber-500" : "text-foreground"}`}>{value}</div>
    </CardContent>
  </Card>
);

const KanbanCard = ({ tender, onStageChange }: { tender: Tender; onStageChange: (t: Tender, s: TenderStage) => void }) => {
  const dd = daysUntil(tender.submission_deadline);
  const overdue = dd != null && dd < 0;
  const urgent = dd != null && dd >= 0 && dd <= 3;
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
      <Link to={`/tenders/${tender.id}`} className="block rounded-md border border-border bg-card p-3 hover:border-accent/40 transition">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="text-sm font-medium leading-tight line-clamp-2">{tender.title}</p>
          <Badge className={priorityColor[tender.priority]} variant="secondary">{tender.priority}</Badge>
        </div>
        {tender.buyer && <p className="text-xs text-muted-foreground line-clamp-1">{tender.buyer}</p>}
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-muted-foreground">{fmtINR(tender.estimated_value)}</span>
          {tender.submission_deadline && (
            <span className={overdue ? "text-red-500" : urgent ? "text-amber-500" : "text-muted-foreground"}>
              {overdue ? <><AlertTriangle className="w-3 h-3 inline mr-0.5" />overdue</> : `${dd}d`}
            </span>
          )}
        </div>
      </Link>
      <select
        className="mt-1 w-full text-xs bg-transparent text-muted-foreground border-none focus:ring-0 cursor-pointer"
        value={tender.stage}
        onChange={(e) => onStageChange(tender, e.target.value as TenderStage)}
        onClick={(e) => e.stopPropagation()}
      >
        {STAGES.map((s) => (
          <option key={s.id} value={s.id}>Move to: {s.label}</option>
        ))}
      </select>
    </motion.div>
  );
};

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <Card>
    <CardContent className="py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
        <LayoutGrid className="w-6 h-6 text-accent" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No tenders yet</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Add your first opportunity to start tracking the bid pipeline.
      </p>
      <Button onClick={onCreate} variant="accent"><Plus className="w-4 h-4 mr-1.5" /> Add tender</Button>
    </CardContent>
  </Card>
);

const CreateTenderDialog = ({
  open, onOpenChange, onCreated, orgId, userId,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; onCreated: (t: Tender) => void; orgId: string; userId: string;
}) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: "", reference_no: "", buyer: "", department: "", category: "",
    source_url: "", estimated_value: "", emd_amount: "",
    submission_deadline: "", stage: "new" as TenderStage, priority: "medium" as TenderPriority, notes: "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.title.trim() || !orgId) return;
    setBusy(true);
    try {
      const t = await createTender({
        organization_id: orgId,
        created_by: userId,
        title: form.title.trim(),
        reference_no: form.reference_no || null,
        buyer: form.buyer || null,
        department: form.department || null,
        category: form.category || null,
        source_url: form.source_url || null,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
        emd_amount: form.emd_amount ? Number(form.emd_amount) : null,
        submission_deadline: form.submission_deadline || null,
        stage: form.stage,
        priority: form.priority,
        notes: form.notes || null,
      });
      onCreated(t);
      setForm({ ...form, title: "", reference_no: "", buyer: "", notes: "" });
      toast({ title: "Tender added" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="accent"><Plus className="w-4 h-4 mr-1.5" /> Add tender</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add tender</DialogTitle>
          <DialogDescription>Capture the basics now — you can enrich the details later.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Title *</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Supply & installation of …" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Reference no.</label>
            <Input value={form.reference_no} onChange={(e) => setForm({ ...form, reference_no: e.target.value })} placeholder="GEM/2025/B/…" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Buyer / PSU</label>
            <Input value={form.buyer} onChange={(e) => setForm({ ...form, buyer: e.target.value })} placeholder="ONGC, NTPC, MoD…" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Department</label>
            <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="IT services, Supply…" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Estimated value (₹)</label>
            <Input type="number" value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">EMD (₹)</label>
            <Input type="number" value={form.emd_amount} onChange={(e) => setForm({ ...form, emd_amount: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Submission deadline</label>
            <Input type="datetime-local" value={form.submission_deadline} onChange={(e) => setForm({ ...form, submission_deadline: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Priority</label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TenderPriority })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Stage</label>
            <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as TenderStage })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Source URL</label>
            <Input value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} placeholder="https://…" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !form.title.trim()} variant="accent">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create tender"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Tenders;
