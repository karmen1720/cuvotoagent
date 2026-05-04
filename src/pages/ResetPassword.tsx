import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CloudLightning, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast({ title: "Password must be 8+ characters", variant: "destructive" });
    if (password !== confirm) return toast({ title: "Passwords don't match", variant: "destructive" });
    setSubmitting(true);
    try {
      await updatePassword(password);
      toast({ title: "Password updated", description: "You're now signed in." });
      navigate("/", { replace: true });
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
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
          <h1 className="text-2xl font-display font-semibold text-white">Set a new password</h1>
          <p className="text-white/60 mt-1 text-sm">
            {hasSession ? "Choose a strong password you haven't used before." : "Open this page from the link in your email."}
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
              className="pl-10 h-11 bg-white/5 border-white/15 text-white placeholder:text-white/30"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              required
              className="pl-10 h-11 bg-white/5 border-white/15 text-white placeholder:text-white/30"
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full h-11 bg-accent hover:bg-accent/90 text-accent-foreground">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
