import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CloudLightning, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrg } from "@/contexts/OrganizationContext";
import { useToast } from "@/hooks/use-toast";

const Onboarding = () => {
  const { createOrganization, organizations, loading } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && organizations.length > 0) navigate("/", { replace: true });
  }, [loading, organizations, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createOrganization(name.trim());
      toast({ title: "Workspace created", description: "Welcome aboard!" });
      navigate("/", { replace: true });
    } catch (err: any) {
      toast({ title: "Failed to create workspace", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(220_55%_6%)] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-2 text-white">
          <CloudLightning className="w-5 h-5 text-accent" />
          <span className="font-display font-bold">Cuvoto Tender AI</span>
        </div>
        <div>
          <h1 className="text-2xl font-display font-semibold text-white">Create your workspace</h1>
          <p className="text-white/60 mt-1 text-sm">
            Each organization gets its own private tenders, proposals, members and roles.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Pvt Ltd"
              required
              autoFocus
              className="pl-10 h-11 bg-white/5 border-white/15 text-white placeholder:text-white/30"
            />
          </div>
          <Button type="submit" disabled={submitting || !name.trim()} className="w-full h-11 bg-accent hover:bg-accent/90 text-accent-foreground">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create workspace"}
          </Button>
          <p className="text-xs text-white/40 text-center">You'll be the admin and can invite teammates next.</p>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
