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
  tenderId: string;
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
  tenderTitle: string,
  userId: string,
): Promise<AnalyzeResult> {
  const orgId = currentOrgId();
  if (!orgId) throw new Error("No active workspace selected");

  const { data: tender, error: tenderError } = await supabase
    .from("tenders")
    .insert({
      organization_id: orgId,
      created_by: userId,
      title: tenderTitle || "Untitled Tender",
      stage: "screening",
    })
    .select("id")
    .single();

  if (tenderError || !tender?.id) throw new Error(tenderError?.message || "Failed to create tender job");

  const { data, error } = await supabase.functions.invoke("analyze-tender", {
    body: { pdfText, companyProfile, orgId, tenderId: tender.id },
  });

  if (error) {
    const { message, quota } = await extractFnError(error, "Failed to analyze tender");
    if (quota) throw new QuotaError(message, quota);
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);

  for (let attempt = 0; attempt < 90; attempt++) {
    const { data: row, error: pollError } = await supabase
      .from("tenders")
      .select("id, raw_requirements, eligibility")
      .eq("id", tender.id)
      .single();

    if (pollError) throw new Error(pollError.message);

    const requirements = row?.raw_requirements as any;
    const eligibility = row?.eligibility as any;
    const reqJob = requirements?._job;
    const eligJob = eligibility?._job;

    if (reqJob?.status === "failed" || eligJob?.status === "failed") {
      throw new Error(reqJob?.error || eligJob?.error || "Tender analysis failed");
    }

    if (requirements && !reqJob && eligibility && !eligJob) {
      return {
        tenderId: row.id,
        requirements,
        eligibility,
      } as AnalyzeResult;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Tender analysis is taking longer than expected. Please try again.");
}

export async function generateProposal(
  tenderId: string,
  tenderTitle: string,
  requirements: TenderRequirements,
  eligibility: any,
  companyProfile: CompanyData,
  userId: string,
): Promise<string> {
  const orgId = currentOrgId();
  if (!orgId) throw new Error("No active workspace selected");

  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .insert({
      organization_id: orgId,
      tender_id: tenderId,
      created_by: userId,
      title: tenderTitle || "Proposal",
      status: "draft",
    })
    .select("id")
    .single();

  if (proposalError || !proposal?.id) throw new Error(proposalError?.message || "Failed to create proposal job");

  const { data, error } = await supabase.functions.invoke("generate-proposal", {
    body: { proposalId: proposal.id, tenderId, tenderTitle, requirements, eligibility, companyProfile, orgId },
  });

  if (error) {
    const { message, quota } = await extractFnError(error, "Failed to generate proposal");
    if (quota) throw new QuotaError(message, quota);
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);

  for (let attempt = 0; attempt < 120; attempt++) {
    const { data: row, error: pollError } = await supabase
      .from("proposals")
      .select("content, metadata")
      .eq("id", proposal.id)
      .single();

    if (pollError) throw new Error(pollError.message);

    const job = (row?.metadata as any)?._job;
    if (job?.status === "failed") {
      throw new Error(job.error || "Proposal generation failed");
    }

    if (row?.content && !job) {
      return row.content;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Proposal generation is taking longer than expected. Please try again.");
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
