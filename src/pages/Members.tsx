import { useEffect, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Mail, Trash2, Users, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useOrg, AppRole } from "@/contexts/OrganizationContext";
import { useToast } from "@/hooks/use-toast";

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  org_admin: "Org Admin",
  proposal_manager: "Proposal Manager",
  tender_analyst: "Tender Analyst",
  reviewer: "Reviewer",
  viewer: "Viewer",
};

const ASSIGNABLE_ROLES: AppRole[] = ["org_admin", "proposal_manager", "tender_analyst", "reviewer", "viewer"];

interface MemberRow {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
}

interface InviteRow {
  id: string;
  email: string;
  role: AppRole;
  status: string;
  created_at: string;
}

const Members = () => {
  const { currentOrg, isOrgAdmin } = useOrg();
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("viewer");
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    if (!currentOrg) return;
    setLoading(true);

    const { data: memberRows } = await supabase
      .from("organization_members")
      .select("user_id, profiles!inner(full_name, avatar_url)")
      .eq("organization_id", currentOrg.id);

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .eq("organization_id", currentOrg.id);

    const roleMap = new Map<string, AppRole>();
    (roleRows || []).forEach((r: any) => roleMap.set(r.user_id, r.role));

    setMembers(
      (memberRows || []).map((m: any) => ({
        user_id: m.user_id,
        full_name: m.profiles?.full_name ?? null,
        avatar_url: m.profiles?.avatar_url ?? null,
        role: roleMap.get(m.user_id) || "viewer",
      }))
    );

    const { data: inviteRows } = await supabase
      .from("organization_invitations")
      .select("id, email, role, status, created_at")
      .eq("organization_id", currentOrg.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setInvites((inviteRows || []) as InviteRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentOrg?.id]);

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !inviteEmail) return;
    setInviting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("organization_invitations").insert({
        organization_id: currentOrg.id,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        invited_by: user.id,
      });
      if (error) throw error;
      toast({ title: "Invitation created", description: "Share the invite link with your teammate." });
      setInviteEmail("");
      load();
    } catch (err: any) {
      toast({ title: "Invite failed", description: err.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, role: AppRole) => {
    if (!currentOrg) return;
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("organization_id", currentOrg.id);
    const { error } = await supabase.from("user_roles").insert({
      user_id: userId, organization_id: currentOrg.id, role,
    });
    if (error) toast({ title: "Failed to update role", description: error.message, variant: "destructive" });
    else { toast({ title: "Role updated" }); load(); }
  };

  const handleRemove = async (userId: string) => {
    if (!currentOrg) return;
    if (!confirm("Remove this member from the workspace?")) return;
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("organization_id", currentOrg.id);
    const { error } = await supabase.from("organization_members").delete()
      .eq("user_id", userId).eq("organization_id", currentOrg.id);
    if (error) toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
    else { toast({ title: "Member removed" }); load(); }
  };

  const handleRevoke = async (id: string) => {
    await supabase.from("organization_invitations").update({ status: "revoked" }).eq("id", id);
    load();
  };

  if (!currentOrg) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/30 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm font-semibold text-foreground">Team members</span>
          </div>
          <Badge variant="outline" className="font-normal">{currentOrg.name}</Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {isOrgAdmin && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-4 h-4 text-accent" />
              <h2 className="font-semibold text-foreground">Invite a teammate</h2>
            </div>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                required
                className="flex-1"
              />
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" disabled={inviting} variant="accent">
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send invite"}
              </Button>
            </form>
          </Card>
        )}

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-accent" />
            <h2 className="font-semibold text-foreground">Members ({members.length})</h2>
          </div>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="divide-y divide-border">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-primary text-accent-foreground flex items-center justify-center text-xs font-semibold uppercase">
                    {(m.full_name || "?")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.full_name || "Member"}</p>
                  </div>
                  {isOrgAdmin && m.role !== "super_admin" ? (
                    <Select value={m.role} onValueChange={(v) => handleRoleChange(m.user_id, v as AppRole)}>
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheck className="w-3 h-3" />{ROLE_LABELS[m.role]}
                    </Badge>
                  )}
                  {isOrgAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemove(m.user_id)} title="Remove">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {invites.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-accent" />
              <h2 className="font-semibold text-foreground">Pending invitations ({invites.length})</h2>
            </div>
            <div className="divide-y divide-border">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 py-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">{ROLE_LABELS[inv.role]} · Invited {new Date(inv.created_at).toLocaleDateString()}</p>
                  </div>
                  {isOrgAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => handleRevoke(inv.id)}>Revoke</Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Members;
