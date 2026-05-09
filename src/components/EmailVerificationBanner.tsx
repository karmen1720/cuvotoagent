import { useState } from "react";
import { Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.email_confirmed_at || dismissed) return null;

  const resend = async () => {
    if (!user.email) return;
    setSending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setSending(false);
    if (error) toast({ title: "Failed to resend", description: error.message, variant: "destructive" });
    else toast({ title: "Verification email sent", description: `Check ${user.email}` });
  };

  return (
    <div className="bg-warning/10 border-b border-warning/30 text-foreground">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Mail className="w-4 h-4 text-warning flex-shrink-0" />
          <span className="truncate">
            Verify <strong>{user.email}</strong> to unlock AI features.
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={resend} disabled={sending}>
            {sending ? "Sending…" : "Resend"}
          </Button>
          <button onClick={() => setDismissed(true)} className="p-1 hover:bg-warning/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
