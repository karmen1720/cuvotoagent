import { supabase } from "@/integrations/supabase/client";
import type { CompanyData } from "@/components/CompanyProfile";
import { DEFAULT_COMPANY } from "@/components/CompanyProfile";

const ALL_KEYS = Object.keys(DEFAULT_COMPANY) as (keyof CompanyData)[];
const LS_KEY = "cuvoto_current_org";

function currentOrgId(): string | null {
  try { return localStorage.getItem(LS_KEY); } catch { return null; }
}

export async function saveCompanyProfile(company: CompanyData): Promise<void> {
  const orgId = currentOrgId();
  if (!orgId) throw new Error("No active workspace");

  const { data: existing } = await supabase
    .from("company_profiles")
    .select("id")
    .eq("organization_id", orgId)
    .limit(1);

  const row: any = { updated_at: new Date().toISOString(), organization_id: orgId };
  for (const k of ALL_KEYS) row[k] = (company as any)[k];

  if (existing && existing.length > 0) {
    await supabase.from("company_profiles").update(row).eq("id", existing[0].id);
  } else {
    await supabase.from("company_profiles").insert(row);
  }
}

export async function loadCompanyProfile(): Promise<CompanyData | null> {
  const orgId = currentOrgId();
  if (!orgId) return null;

  const { data } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return null;

  const row = data[0] as any;
  const out: any = { ...DEFAULT_COMPANY };
  for (const k of ALL_KEYS) {
    if (row[k] !== null && row[k] !== undefined) out[k] = row[k];
  }
  out.msme = row.msme ?? DEFAULT_COMPANY.msme;
  out.startup = row.startup ?? DEFAULT_COMPANY.startup;
  out.land_border_equity = row.land_border_equity ?? false;
  out.subletting_allowed = row.subletting_allowed ?? false;
  out.certifications = row.certifications || [];
  out.past_projects = row.past_projects || [];
  out.additional_gsts = row.additional_gsts || [];
  return out as CompanyData;
}
