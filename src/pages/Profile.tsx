import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Mail, Calendar, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { loadCompanyProfile } from "@/lib/company-storage";
import type { CompanyData } from "@/components/CompanyProfile";
import CompanyProfile, { DEFAULT_COMPANY } from "@/components/CompanyProfile";
import { saveCompanyProfile } from "@/lib/company-storage";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [company, setCompany] = useState<CompanyData>(DEFAULT_COMPANY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanyProfile()
      .then((c) => { if (c) setCompany(c); })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const fullName = (user?.user_metadata as any)?.full_name || (user?.user_metadata as any)?.name;
  const lastSignIn = user?.last_sign_in_at;

  const handleEdit = async (updated: CompanyData) => {
    setCompany(updated);
    try {
      await saveCompanyProfile(updated);
      toast({ title: "Profile saved!" });
    } catch {
      toast({ title: "Saved locally", description: "Could not sync to cloud." });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" /> Log out
          </Button>
        </div>
      </header>

      <div className="pt-20 pb-12 max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Account & Company</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account details and company profile.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{user?.email}</span>
            </div>
            {fullName && (
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{fullName}</span>
              </div>
            )}
            {lastSignIn && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Signed in {new Date(lastSignIn).toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
          </div>
        ) : (
          <CompanyProfile company={company} onEdit={handleEdit} />
        )}
      </div>
    </div>
  );
};

export default Profile;
