import { useState, FormEvent } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User, CloudLightning, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import loginBg from "@/assets/login-bg.jpg";

const Register = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Email and password required", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (!agree) {
      toast({ title: "Please accept the Terms to continue", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // Local-only registration for now — store the pending account hint and route to login.
      try {
        localStorage.setItem("cuvoto_pending_email", email);
        if (name) localStorage.setItem("cuvoto_pending_name", name);
      } catch {}
      toast({ title: "Account created!", description: "Please sign in with your new credentials." });
      navigate("/login", { replace: true, state: { email } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[hsl(220_55%_6%)] text-foreground grid grid-cols-1 lg:grid-cols-2">
      {/* Left visual */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden">
        <img
          src={loginBg}
          alt=""
          width={1024}
          height={1536}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220_60%_8%)]/70 via-[hsl(220_55%_10%)]/40 to-[hsl(174_40%_20%)]/40" />

        <div className="relative z-10 p-10 flex flex-col h-full justify-between">
          <div />
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/15 border border-accent/30 backdrop-blur-sm">
              <CloudLightning className="w-4 h-4 text-accent" />
              <span className="text-accent font-display font-semibold text-sm">Cuvoto Tender AI</span>
            </div>
            <div>
              <h1 className="text-3xl xl:text-4xl font-display font-bold text-white leading-tight">
                Start winning more tenders today
              </h1>
              <p className="mt-3 text-white/70 max-w-md text-sm leading-relaxed">
                Create your account and get instant access to AI-powered tender analysis and proposal generation aligned with Indian procurement standards.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-white/80 max-w-sm">
              {[
                "Automated GFR 2017 / CVC compliant analysis",
                "13 ready-to-submit proposal documents",
                "Eligibility checks against your company profile",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-7"
        >
          <div className="lg:hidden flex items-center gap-2">
            <CloudLightning className="w-5 h-5 text-accent" />
            <span className="font-display font-bold text-white">Cuvoto Tender AI</span>
          </div>

          <div>
            <h2 className="text-2xl font-display font-semibold text-white">Create your account</h2>
            <p className="text-white/60 mt-1">Start your free trial — no credit card required.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[11px] font-semibold tracking-widest text-white/70">FULL NAME</label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="pl-10 h-11 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-accent"
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold tracking-widest text-white/70">EMAIL ADDRESS</label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="pl-10 h-11 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-accent"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold tracking-widest text-white/70">PASSWORD</label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="pl-10 pr-10 h-11 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-accent"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold tracking-widest text-white/70">CONFIRM PASSWORD</label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="pl-10 h-11 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-accent"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-white/70 cursor-pointer">
              <Checkbox
                checked={agree}
                onCheckedChange={(c) => setAgree(!!c)}
                className="mt-0.5 border-white/30 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
              />
              <span>
                I agree to the{" "}
                <a href="#" className="text-accent hover:underline">Terms of Service</a> and{" "}
                <a href="#" className="text-accent hover:underline">Privacy Policy</a>.
              </span>
            </label>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-sm tracking-wide shadow-[0_0_30px_hsl(174_62%_47%/0.35)]"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  CREATE ACCOUNT <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-white/60">
            Already have an account?{" "}
            <Link to="/login" className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>

          <div className="flex items-center justify-center gap-6 text-xs text-white/40 pt-2">
            <a href="#" className="hover:text-white/70">Terms of Service</a>
            <a href="#" className="hover:text-white/70">Privacy Policy</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
