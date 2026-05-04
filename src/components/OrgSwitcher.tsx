import { useState } from "react";
import { Building2, Check, ChevronsUpDown, Plus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrg } from "@/contexts/OrganizationContext";
import { useToast } from "@/hooks/use-toast";

const OrgSwitcher = () => {
  const { organizations, currentOrg, switchOrg, createOrganization } = useOrg();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createOrganization(name.trim());
      toast({ title: "Workspace created" });
      setOpen(false); setName("");
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted transition text-sm">
          <Building2 className="w-4 h-4 text-accent" />
          <span className="font-medium text-foreground truncate max-w-[140px]">{currentOrg?.name || "Workspace"}</span>
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
        {organizations.map((o) => (
          <DropdownMenuItem key={o.id} onClick={() => switchOrg(o.id)} className="cursor-pointer">
            <Building2 className="w-4 h-4 mr-2" />
            <span className="flex-1 truncate">{o.name}</span>
            {currentOrg?.id === o.id && <Check className="w-4 h-4 text-accent" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/members" className="cursor-pointer">
            <Users className="w-4 h-4 mr-2" /> Members & roles
          </Link>
        </DropdownMenuItem>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" /> New workspace
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create workspace</DialogTitle>
              <DialogDescription>Each workspace has its own tenders, members, and billing.</DialogDescription>
            </DialogHeader>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workspace name" autoFocus />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={busy || !name.trim()} variant="accent">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrgSwitcher;
