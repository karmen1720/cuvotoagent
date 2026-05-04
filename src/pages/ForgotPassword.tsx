import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { CloudLightning, Loader2, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const { resetPasswordForEmail } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await resetPasswordForEmail(email);
      setSent(true);
      toast({ title: "Reset link sent", description: "Check your email." });
    } catch (err: any) {
      toast({ title: "Could not send reset", description: err.message, variant: "destructive" });
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
          <h1 className="text-2xl font-display font-semibold text-white">Reset your password</h1>
          <p className="text-white/60 mt-1 text-sm">Enter your email and we'll send a reset link.</p>
        </div>

        {sent ? (
          <div className="rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm text-white/80">
            If an account exists for <strong>{email}</strong>, a reset link is on its way.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="pl-10 h-11 bg-white/5 border-white/15 text-white placeholder:text-white/30"
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-11 bg-accent hover:bg-accent/90 text-accent-foreground">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset link"}
            </Button>
          </form>
        )}

        <Link to="/login" className="text-sm text-accent hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
