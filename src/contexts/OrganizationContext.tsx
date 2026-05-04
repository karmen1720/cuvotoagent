import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole =
  | "super_admin"
  | "org_admin"
  | "proposal_manager"
  | "tender_analyst"
  | "reviewer"
  | "viewer";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "trial" | "starter" | "professional" | "enterprise";
  owner_id: string;
  logo_url: string | null;
  trial_ends_at: string | null;
}

interface OrgContextValue {
  organizations: Organization[];
  currentOrg: Organization | null;
  roles: AppRole[];
  loading: boolean;
  isOrgAdmin: boolean;
  isSuperAdmin: boolean;
  switchOrg: (id: string) => void;
  refresh: () => Promise<void>;
  createOrganization: (name: string) => Promise<Organization>;
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined);
const LS_KEY = "cuvoto_current_org";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "workspace";

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrg(null);
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: members } = await supabase
      .from("organization_members")
      .select("organization_id, organizations(*)")
      .eq("user_id", user.id);

    const orgs = (members || [])
      .map((m: any) => m.organizations)
      .filter(Boolean) as Organization[];

    setOrganizations(orgs);

    const stored = localStorage.getItem(LS_KEY);
    const next = orgs.find((o) => o.id === stored) || orgs[0] || null;
    setCurrentOrg(next);
    if (next) localStorage.setItem(LS_KEY, next.id);

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role, organization_id")
      .eq("user_id", user.id);

    const orgRoles = (roleRows || [])
      .filter((r: any) => r.organization_id === next?.id || r.role === "super_admin")
      .map((r: any) => r.role as AppRole);
    setRoles(orgRoles);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const switchOrg = (id: string) => {
    const o = organizations.find((x) => x.id === id);
    if (!o) return;
    setCurrentOrg(o);
    localStorage.setItem(LS_KEY, o.id);
    refresh();
  };

  const createOrganization = async (name: string): Promise<Organization> => {
    if (!user) throw new Error("Not signed in");
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: org, error } = await supabase
      .from("organizations")
      .insert({ name, slug, owner_id: user.id })
      .select()
      .single();
    if (error) throw error;

    await supabase.from("organization_members").insert({
      organization_id: org.id,
      user_id: user.id,
    });
    await supabase.from("user_roles").insert({
      user_id: user.id,
      organization_id: org.id,
      role: "org_admin",
    });

    await refresh();
    localStorage.setItem(LS_KEY, org.id);
    return org as Organization;
  };

  const isSuperAdmin = roles.includes("super_admin");
  const isOrgAdmin = isSuperAdmin || roles.includes("org_admin");

  return (
    <OrgContext.Provider
      value={{ organizations, currentOrg, roles, loading, isOrgAdmin, isSuperAdmin, switchOrg, refresh, createOrganization }}
    >
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrganizationProvider");
  return ctx;
};
