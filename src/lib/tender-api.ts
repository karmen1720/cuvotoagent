import { supabase } from "@/integrations/supabase/client";
import type { TenderRequirements } from "@/components/RequirementsDisplay";
import type { CompanyData } from "@/components/CompanyProfile";
import { extractPdfText } from "@/lib/pdf-text";
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

async function extractFnError(error: any, fallback: string): Promise<string> {
  try {
    const ctx = error?.context;
    if (ctx && typeof ctx.json === "function") {
      const body = await ctx.json();
      if (body?.error) return body.error;
    } else if (ctx && typeof ctx.text === "function") {
      const txt = await ctx.text();
      try {
        const body = JSON.parse(txt);
        if (body?.error) return body.error;
      } catch {
        if (txt) return txt;
      }
    }
  } catch {}
  return error?.message || fallback;
}

export async function analyzeTender(
  pdfText: string,
  companyProfile: CompanyData
): Promise<AnalyzeResult> {
  const { data, error } = await supabase.functions.invoke("analyze-tender", {
    body: { pdfText, companyProfile },
  });

  if (error) throw new Error(await extractFnError(error, "Failed to analyze tender"));
  if (data?.error) throw new Error(data.error);
  return data as AnalyzeResult;
}

export async function generateProposal(
  tenderTitle: string,
  requirements: TenderRequirements,
  eligibility: any,
  companyProfile: CompanyData
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-proposal", {
    body: { tenderTitle, requirements, eligibility, companyProfile },
  });

  if (error) throw new Error(await extractFnError(error, "Failed to generate proposal"));
  if (data?.error) throw new Error(data.error);
  return data.proposal;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const text = await extractPdfText(file);
    if (text && text.length >= 200) return text;
    throw new Error("Extracted text too short");
  } catch (e) {
    console.warn("[extractTextFromPdf] pdf.js failed, returning filename fallback", e);
    return `Tender document: ${file.name}\n\n(Note: automatic text extraction failed. Please paste the tender text manually for best results.)`;
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
