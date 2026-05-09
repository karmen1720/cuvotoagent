import { supabase } from "@/integrations/supabase/client";
import type { TenderRequirements } from "@/components/RequirementsDisplay";
import type { CompanyData } from "@/components/CompanyProfile";
import { extractPdfText, PdfExtractionError } from "@/lib/pdf-text";
import Papa from "papaparse";

interface EligibilityCheck {
  label: string;
  eligible: boolean;
  detail: string;
}

interface AnalyzeResult {
  requirements: TenderRequirements & { summary?: string; tender_value?: string; deadline?: string };
  eligibility: {
    overall_score: number;
    checks: EligibilityCheck[];
    recommendation: string;
  } | null;
}

export class QuotaError extends Error {
  remaining = 0;
  limit = 0;
  plan = "trial";
  constructor(message: string, info?: { remaining?: number; limit?: number; plan?: string }) {
    super(message);
    this.name = "QuotaError";
    if (info?.remaining != null) this.remaining = info.remaining;
    if (info?.limit != null) this.limit = info.limit;
    if (info?.plan) this.plan = info.plan;
  }
}

async function extractFnError(error: any, fallback: string): Promise<{ message: string; quota?: any }> {
  try {
    const ctx = error?.context;
    let body: any = null;
    if (ctx && typeof ctx.json === "function") body = await ctx.json();
    else if (ctx && typeof ctx.text === "function") {
      const txt = await ctx.text();
      try { body = JSON.parse(txt); } catch { return { message: txt || fallback }; }
    }
    if (body?.error) return { message: body.error, quota: body.quota };
  } catch {}
  return { message: error?.message || fallback };
}

function currentOrgId(): string | null {
  try { return localStorage.getItem("cuvoto_current_org"); } catch { return null; }
}

export async function analyzeTender(
  pdfText: string,
  companyProfile: CompanyData,
): Promise<AnalyzeResult> {
  const orgId = currentOrgId();
  if (!orgId) throw new Error("No active workspace selected");

  const { data, error } = await supabase.functions.invoke("analyze-tender", {
    body: { pdfText, companyProfile, orgId },
  });

  if (error) {
    const { message, quota } = await extractFnError(error, "Failed to analyze tender");
    if (quota) throw new QuotaError(message, quota);
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data as AnalyzeResult;
}

export async function generateProposal(
  tenderTitle: string,
  requirements: TenderRequirements,
  eligibility: any,
  companyProfile: CompanyData,
): Promise<string> {
  const orgId = currentOrgId();
  if (!orgId) throw new Error("No active workspace selected");

  const { data, error } = await supabase.functions.invoke("generate-proposal", {
    body: { tenderTitle, requirements, eligibility, companyProfile, orgId },
  });

  if (error) {
    const { message, quota } = await extractFnError(error, "Failed to generate proposal");
    if (quota) throw new QuotaError(message, quota);
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data.proposal;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    return await extractPdfText(file);
  } catch (e) {
    if (e instanceof PdfExtractionError) throw e;
    throw new PdfExtractionError(
      "unreadable",
      "We couldn't read this PDF. It may be password-protected or corrupted. Paste the tender text manually below.",
    );
  }
}

export function parseCsvToTenders(text: string): string[] {
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
  if (!parsed.data || parsed.data.length < 2) return [];

  const headers = (parsed.data[0] as string[]).map((h) => String(h).trim().toLowerCase());
  let titleIdx = headers.findIndex((h) => h.includes("tender") && h.includes("title"));
  if (titleIdx === -1) titleIdx = headers.findIndex((h) => h.includes("title") || h.includes("tender") || h.includes("name"));
  if (titleIdx === -1) titleIdx = 0;

  return (parsed.data.slice(1) as string[][])
    .map((row) => String(row[titleIdx] ?? "").trim())
    .filter(Boolean);
}
