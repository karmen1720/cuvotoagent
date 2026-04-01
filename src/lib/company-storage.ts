import { supabase } from "@/integrations/supabase/client";
import type { CompanyData } from "@/components/CompanyProfile";

const DEVICE_KEY = "cuvoto_device_id";

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export async function saveCompanyProfile(company: CompanyData): Promise<void> {
  const deviceId = getDeviceId();

  // Check if profile exists for this device
  const { data: existing } = await supabase
    .from("company_profiles")
    .select("id")
    .eq("company_name", company.company_name)
    .limit(1);

  const row = {
    company_name: company.company_name,
    msme: company.msme,
    startup: company.startup,
    pan: company.pan,
    tan: company.tan,
    gst: company.gst,
    cin: company.cin,
    dpiit_number: company.dpiit_number,
    udyam_number: company.udyam_number,
    address: company.address,
    contact_person: company.contact_person,
    contact_email: company.contact_email,
    contact_phone: company.contact_phone,
    annual_turnover: company.annual_turnover,
    years_experience: company.years_experience,
    employees_count: company.employees_count,
    certifications: company.certifications,
    past_projects: company.past_projects,
    bank_name: company.bank_name,
    bank_account: company.bank_account,
    ifsc_code: company.ifsc_code,
    updated_at: new Date().toISOString(),
  };

  if (existing && existing.length > 0) {
    await supabase.from("company_profiles").update(row).eq("id", existing[0].id);
  } else {
    await supabase.from("company_profiles").insert(row);
  }
}

export async function loadCompanyProfile(): Promise<CompanyData | null> {
  const { data } = await supabase
    .from("company_profiles")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return null;

  const row = data[0];
  return {
    company_name: row.company_name || "",
    msme: row.msme ?? false,
    startup: row.startup ?? false,
    pan: row.pan || "",
    tan: row.tan || "",
    gst: row.gst || "",
    cin: row.cin || "",
    dpiit_number: row.dpiit_number || "",
    udyam_number: row.udyam_number || "",
    address: row.address || "",
    contact_person: row.contact_person || "",
    contact_email: row.contact_email || "",
    contact_phone: row.contact_phone || "",
    annual_turnover: row.annual_turnover || "",
    years_experience: row.years_experience || "",
    employees_count: row.employees_count || "",
    certifications: row.certifications || [],
    past_projects: row.past_projects || [],
    bank_name: row.bank_name || "",
    bank_account: row.bank_account || "",
    ifsc_code: row.ifsc_code || "",
  };
}
