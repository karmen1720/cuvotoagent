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
    authorized_signatory_name: company.authorized_signatory_name,
    authorized_signatory_designation: company.authorized_signatory_designation,
    office_city: company.office_city,
    local_content_percentage: company.local_content_percentage,
    escalation_l1_name: company.escalation_l1_name,
    escalation_l1_email: company.escalation_l1_email,
    escalation_l2_name: company.escalation_l2_name,
    escalation_l2_email: company.escalation_l2_email,
    escalation_l3_name: company.escalation_l3_name,
    escalation_l3_email: company.escalation_l3_email,
    support_phone: company.support_phone,
    support_email: company.support_email,
    nature_of_business: company.nature_of_business,
    year_of_incorporation: company.year_of_incorporation,
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

  const row = data[0] as any;
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
    authorized_signatory_name: row.authorized_signatory_name || "",
    authorized_signatory_designation: row.authorized_signatory_designation || "",
    office_city: row.office_city || "",
    local_content_percentage: row.local_content_percentage || "100",
    escalation_l1_name: row.escalation_l1_name || "",
    escalation_l1_email: row.escalation_l1_email || "",
    escalation_l2_name: row.escalation_l2_name || "",
    escalation_l2_email: row.escalation_l2_email || "",
    escalation_l3_name: row.escalation_l3_name || "",
    escalation_l3_email: row.escalation_l3_email || "",
    support_phone: row.support_phone || "",
    support_email: row.support_email || "",
    nature_of_business: row.nature_of_business || "",
    year_of_incorporation: row.year_of_incorporation || "",
  };
}
