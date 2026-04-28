import { useState, useEffect, useMemo, FormEvent } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User, CloudLightning, Loader2, Check, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import loginBg from "@/assets/login-bg.jpg";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const scorePassword = (pw: string) => {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4); // 0..4
};

const STRENGTH = [
  { label: "Too weak", color: "bg-destructive", text: "text-destructive" },
  { label: "Weak", color: "bg-destructive", text: "text-destructive" },
  { label: "Fair", color: "bg-warning", text: "text-warning" },
  { label: "Good", color: "bg-info", text: "text-info" },
  { label: "Strong", color: "bg-success", text: "text-success" },
];

const Register = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(true);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  if (user) return <Navigate to="/" replace />;

  const emailValid = EMAIL_RE.test(email);
  const pwScore = scorePassword(password);
  const pwLongEnough = password.length >= 6;
  const pwMatches = confirm.length > 0 && password === confirm;
  const formValid = emailValid && pwLongEnough && pwMatches && agree;

  const errors = {
    email: touched.email && email && !emailValid ? "Enter a valid email address." : "",
    password: touched.password && password && !pwLongEnough ? "Use at least 6 characters." : "",
    confirm: touched.confirm && confirm && !pwMatches ? "Passwords don't match." : "",
  };

  // Success → countdown → redirect to login
  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) {
      navigate("/login", { replace: true, state: { email } });
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [success, countdown, navigate, email]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true, confirm: true });
    if (!formValid) return;

    setSubmitting(true);
    try {
      try {
        localStorage.setItem("cuvoto_pending_email", email);
        if (name) localStorage.setItem("cuvoto_pending_name", name);
      } catch {}
      // Brief delay so the user sees feedback
      await new Promise((r) => setTimeout(r, 600));
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  const checks = useMemo(
    () => [
      { ok: password.length >= 6, label: "At least 6 characters" },
      { ok: /[A-Z]/.test(password) && /[a-z]/.test(password), label: "Upper & lower case letters" },
      { ok: /\d/.test(password), label: "A number" },
      { ok: /[^A-Za-z0-9]/.test(password), label: "A symbol (recommended)" },
    ],
    [password]
  );

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
                  <CheckCircle2 className="mt-0.5 w-4 h-4 text-accent flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-semibold text-white">Account created!</h2>
                <p className="text-white/60 mt-2">
                  Welcome aboard{name ? `, ${name.split(" ")[0]}` : ""}. Redirecting you to sign in…
                </p>
              </div>
              <div className="text-sm text-white/50">Redirecting in {countdown}s</div>
              <Button
                onClick={() => navigate("/login", { replace: true, state: { email } })}
                className="w-full h-11 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
              >
                Go to sign in now <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md space-y-6"
            >
              <div className="lg:hidden flex items-center gap-2">
                <CloudLightning className="w-5 h-5 text-accent" />
                <span className="font-display font-bold text-white">Cuvoto Tender AI</span>
              </div>

              <div>
                <h2 className="text-2xl font-display font-semibold text-white">Create your account</h2>
                <p className="text-white/60 mt-1">Free to start — no credit card required.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Name */}
                <div>
                  <label className="text-[11px] font-semibold tracking-widest text-white/70">FULL NAME <span className="text-white/30 normal-case font-normal tracking-normal">(optional)</span></label>
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

                {/* Email */}
                <div>
                  <label className="text-[11px] font-semibold tracking-widest text-white/70">EMAIL ADDRESS</label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      placeholder="name@company.com"
                      className={`pl-10 pr-10 h-11 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-accent ${
                        errors.email ? "border-destructive focus-visible:ring-destructive" : "border-white/15"
                      }`}
                      autoComplete="email"
                      required
                      aria-invalid={!!errors.email}
                    />
                    {email && emailValid && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
                    )}
                  </div>
                  {errors.email && <p className="text-xs text-destructive mt-1.5 flex items-center gap-1"><X className="w-3 h-3" /> {errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="text-[11px] font-semibold tracking-widest text-white/70">PASSWORD</label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                      placeholder="At least 6 characters"
                      className={`pl-10 pr-10 h-11 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-accent ${
                        errors.password ? "border-destructive focus-visible:ring-destructive" : "border-white/15"
                      }`}
                      autoComplete="new-password"
                      required
                      aria-invalid={!!errors.password}
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

                  {/* Strength meter */}
                  {password && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i < pwScore ? STRENGTH[pwScore].color : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={STRENGTH[pwScore].text}>{STRENGTH[pwScore].label}</span>
                        <span className="text-white/40">{password.length} chars</span>
                      </div>
                      <ul className="space-y-1 pt-1">
                        {checks.map((c) => (
                          <li key={c.label} className={`text-xs flex items-center gap-1.5 ${c.ok ? "text-success" : "text-white/40"}`}>
                            {c.ok ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-white/30" />}
                            {c.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {errors.password && <p className="text-xs text-destructive mt-1.5 flex items-center gap-1"><X className="w-3 h-3" /> {errors.password}</p>}
                </div>

                {/* Confirm */}
                <div>
                  <label className="text-[11px] font-semibold tracking-widest text-white/70">CONFIRM PASSWORD</label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                      placeholder="Re-enter password"
                      className={`pl-10 pr-10 h-11 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-accent ${
                        errors.confirm ? "border-destructive focus-visible:ring-destructive" : "border-white/15"
                      }`}
                      autoComplete="new-password"
                      required
                      aria-invalid={!!errors.confirm}
                    />
                    {confirm && pwMatches && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
                    )}
                  </div>
                  {errors.confirm && <p className="text-xs text-destructive mt-1.5 flex items-center gap-1"><X className="w-3 h-3" /> {errors.confirm}</p>}
                </div>

                <label className="flex items-start gap-2 text-sm text-white/70 cursor-pointer">
                  <Checkbox
                    checked={agree}
                    onCheckedChange={(c) => setAgree(!!c)}
                    className="mt-0.5 border-white/30 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                  />
                  <span>
                    I agree to the{" "}
                    <a href="#" className="text-accent hover:underline">Terms</a> and{" "}
                    <a href="#" className="text-accent hover:underline">Privacy Policy</a>.
                  </span>
                </label>

                <Button
                  type="submit"
                  disabled={submitting || !formValid}
                  className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-sm tracking-wide shadow-[0_0_30px_hsl(174_62%_47%/0.35)] disabled:opacity-50 disabled:shadow-none"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating account…</>
                  ) : (
                    <>CREATE ACCOUNT <ArrowRight className="w-4 h-4 ml-1" /></>
                  )}
                </Button>

                {!formValid && (touched.email || touched.password || touched.confirm) && (
                  <p className="text-xs text-white/40 text-center">Complete the fields above to continue.</p>
                )}
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
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Register;
