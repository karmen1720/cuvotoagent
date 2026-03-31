import { supabase } from "@/integrations/supabase/client";
import type { TenderRequirements } from "@/components/RequirementsDisplay";
import type { CompanyData } from "@/components/CompanyProfile";

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

export async function analyzeTender(
  pdfText: string,
  companyProfile: CompanyData
): Promise<AnalyzeResult> {
  const { data, error } = await supabase.functions.invoke("analyze-tender", {
    body: { pdfText, companyProfile },
  });

  if (error) throw new Error(error.message || "Failed to analyze tender");
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

  if (error) throw new Error(error.message || "Failed to generate proposal");
  if (data?.error) throw new Error(data.error);
  return data.proposal;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  // Read PDF as text - basic extraction from raw bytes
  // For production, you'd use a proper PDF parser
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Try to extract text content from PDF binary
  let text = "";
  let inText = false;
  let parenDepth = 0;
  
  const decoder = new TextDecoder("latin1");
  const content = decoder.decode(bytes);
  
  // Extract text between BT/ET blocks and parentheses
  const textMatches = content.match(/\(([^)]*)\)/g);
  if (textMatches) {
    text = textMatches
      .map(m => m.slice(1, -1))
      .filter(t => t.length > 1 && /[a-zA-Z]/.test(t))
      .join(" ");
  }
  
  // If we couldn't extract much, use the filename + raw readable portions
  if (text.length < 50) {
    // Fallback: extract any readable ASCII sequences
    const readableChunks: string[] = [];
    let chunk = "";
    for (let i = 0; i < content.length; i++) {
      const code = content.charCodeAt(i);
      if (code >= 32 && code <= 126) {
        chunk += content[i];
      } else {
        if (chunk.length > 4) readableChunks.push(chunk);
        chunk = "";
      }
    }
    if (chunk.length > 4) readableChunks.push(chunk);
    text = readableChunks.join(" ").substring(0, 10000);
  }

  return text || `Tender document: ${file.name}`;
}

export function parseCsvToTenders(text: string): string[] {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  const titleIndex = headers.findIndex(h => 
    h.toLowerCase().includes("tender") && h.toLowerCase().includes("title")
  ) ?? headers.findIndex(h => h.toLowerCase().includes("title")) ?? 0;
  
  const idx = titleIndex >= 0 ? titleIndex : 0;
  
  return lines.slice(1).map(line => {
    const cols = line.split(",").map(c => c.trim().replace(/"/g, ""));
    return cols[idx] || "";
  }).filter(Boolean);
}
