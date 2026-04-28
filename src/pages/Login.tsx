import { useState, FormEvent } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail, CloudLightning, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import loginBg from "@/assets/login-bg.jpg";

const Login = () => {
  const { user, login, loginWithProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/";

  if (user) return <Navigate to={from} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password, remember);
      toast({ title: "Welcome back!", description: "Signed in successfully." });
      navigate(from, { replace: true });
    } catch (err: any) {
      toast({ title: "Sign in failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProvider = async (provider: "google" | "microsoft") => {
    setSubmitting(true);
    try {
      await loginWithProvider(provider);
      toast({ title: `Signed in with ${provider}` });
      navigate(from, { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[hsl(220_55%_6%)] text-foreground grid grid-cols-1 lg:grid-cols-2">
      {/* Left: brand visual */}
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
                Empowering Your Procurement with AI
              </h1>
              <p className="mt-3 text-white/70 max-w-md text-sm leading-relaxed">
                Unleash the power of automated document extraction and intelligent proposal generation. Procurement, redefined.
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/10 backdrop-blur-sm max-w-sm">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[hsl(220_55%_6%)] bg-gradient-to-br from-accent to-primary"
                  />
                ))}
              </div>
              <div>
                <p className="text-accent text-[11px] font-semibold tracking-wider uppercase">
                  Joined 2,400+ Teams
                </p>
                <p className="text-white/80 text-sm">Analyzing billions in contract value</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="lg:hidden flex items-center gap-2">
            <CloudLightning className="w-5 h-5 text-accent" />
            <span className="font-display font-bold text-white">Cuvoto Tender AI</span>
          </div>

          <div>
            <h2 className="text-2xl font-display font-semibold text-white">Welcome back</h2>
            <p className="text-white/60 mt-1">Please enter your details to sign in.</p>
          </div>

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleProvider("google")}
              disabled={submitting}
              className="flex items-center justify-center gap-2 h-11 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition text-white text-sm font-medium disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#fff" d="M21.35 11.1h-9.17v2.91h5.27c-.23 1.49-1.71 4.36-5.27 4.36-3.18 0-5.77-2.63-5.77-5.87s2.59-5.87 5.77-5.87c1.81 0 3.02.77 3.71 1.43l2.53-2.43C16.9 4.18 14.74 3.2 12.18 3.2 6.95 3.2 2.7 7.45 2.7 12.5s4.25 9.3 9.48 9.3c5.47 0 9.1-3.84 9.1-9.25 0-.62-.07-1.1-.13-1.45z"/></svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleProvider("microsoft")}
              disabled={submitting}
              className="flex items-center justify-center gap-2 h-11 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition text-white text-sm font-medium disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#7fba00" d="M13 1h10v10H13z"/><path fill="#00a4ef" d="M1 13h10v10H1z"/><path fill="#ffb900" d="M13 13h10v10H13z"/></svg>
              Microsoft
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] tracking-widest text-white/40">
            <div className="h-px bg-white/15 flex-1" />
            OR CONTINUE WITH EMAIL
            <div className="h-px bg-white/15 flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold tracking-widest text-white/70">PASSWORD</label>
                <Link to="/login" className="text-xs text-accent hover:underline">Forgot password?</Link>
              </div>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-accent"
                  autoComplete="current-password"
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

            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
              <Checkbox
                checked={remember}
                onCheckedChange={(c) => setRemember(!!c)}
                className="border-white/30 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
              />
              Keep me logged in
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
                  SIGN IN <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-white/60">
            Don't have an account?{" "}
            <Link to="/login" className="text-accent hover:underline font-medium">
              Create an account
            </Link>
          </p>

          <div className="flex items-center justify-center gap-6 text-xs text-white/40 pt-4">
            <a href="#" className="hover:text-white/70">Terms of Service</a>
            <a href="#" className="hover:text-white/70">Privacy Policy</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
