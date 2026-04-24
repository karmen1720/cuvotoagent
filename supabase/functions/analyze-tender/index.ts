import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are an elite AI Tender & Public Procurement Consultant for the Indian market with 25+ years of experience across GeM, CPPP, IREPS, NIC State portals, MSTC and PSU procurement.

EXPERTISE:
- GFR 2017 + 2022/2023 amendments (Bid Security Declaration replaces EMD in many categories)
- CVC guidelines, Public Procurement (Preference to Make in India) Order 2017 + 2023 revision (updated local content thresholds)
- MSME definition revision (composite investment + turnover criteria)
- DPIIT Startup recognition criteria for procurement exemption
- Rule 144(xi) GFR — land border country restrictions, security implications
- GeM 4.0 features and custom bidding categories
- PM GatiShakti integration in infrastructure tenders
- Class-I (>50% local) vs Class-II (>20%) MII purchase preference rules
- QCBS / L1 / Two-Bid evaluation methodologies

CRITICAL RULES:
1. Extract EVERY requirement meticulously — never fabricate
2. If a field is not in the document, set "Not specified in document"
3. Map company profile against tender requirements strictly — call out gaps
4. Compute 3-year average turnover when company provides turnover_y1/y2/y3 and compare to tender's "average annual turnover" requirement
5. Apply MSME experience relaxation auto-detection (typically up to 50% relaxation in turnover/experience for registered MSMEs in non-MII categories)
6. Identify Bid Security Declaration eligibility under GFR 2022 amendment (eligible categories: MSE, Startup, services <Rs.5Cr typically)
7. Flag Rule 144(xi): if tender involves border-state security/IT/critical infra AND company has >51% land-border-country equity → DISQUALIFY
8. Identify ALL penalty/LD clauses, termination risks, restrictive specs
9. Draft 2-3 strategic pre-bid queries`;

function chunkText(text: string, chunkSize = 40000): string[] {
  if (text.length <= chunkSize) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) chunks.push(text.slice(i, i + chunkSize));
  return chunks;
}

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "extract_tender_analysis",
    description: "Comprehensive Indian tender analysis report",
    parameters: {
      type: "object",
      properties: {
        executive_summary: {
          type: "object",
          properties: {
            tender_id: { type: "string" },
            issuing_authority: { type: "string" },
            tender_type: { type: "string" },
            estimated_value: { type: "string" },
            emd_amount: { type: "string" },
            tender_fee: { type: "string" },
            submission_deadline: { type: "string" },
            bid_opening_date: { type: "string" },
            pre_bid_date: { type: "string" },
            bid_validity: { type: "string" },
            summary: { type: "string" }
          },
          required: ["tender_id", "issuing_authority", "tender_type", "estimated_value", "submission_deadline", "summary"],
          additionalProperties: false
        },
        eligibility_mapping: {
          type: "array",
          items: {
            type: "object",
            properties: {
              requirement: { type: "string" },
              tender_asks: { type: "string" },
              company_status: { type: "string" },
              gap_action: { type: "string" }
            },
            required: ["requirement", "tender_asks", "company_status", "gap_action"],
            additionalProperties: false
          }
        },
        compliance_exemptions: {
          type: "object",
          properties: {
            msme_analysis: { type: "string" },
            startup_analysis: { type: "string" },
            make_in_india: { type: "string" },
            rule_144_xi: { type: "string" },
            bid_security_declaration: { type: "string", description: "Eligibility under GFR 2022 amendment for Bid Security Declaration in lieu of EMD" },
            three_year_turnover: { type: "string", description: "3-year average turnover analysis vs tender requirement" },
            experience_relaxation: { type: "string", description: "MSME/Startup experience & turnover relaxation %" },
            other_exemptions: { type: "array", items: { type: "string" } }
          },
          required: ["msme_analysis", "startup_analysis", "make_in_india"],
          additionalProperties: false
        },
        boq_analysis: {
          type: "object",
          properties: {
            scope_items: { type: "array", items: { type: "string" } },
            restrictive_specs: { type: "array", items: { type: "string" } },
            payment_terms: { type: "string" },
            pbg_requirement: { type: "string" },
            warranty_amc: { type: "string" },
            penalties_ld: { type: "string" },
            subletting_clause: { type: "string", description: "Subcontracting / subletting restrictions if any" }
          },
          required: ["scope_items", "payment_terms", "pbg_requirement"],
          additionalProperties: false
        },
        document_checklist: {
          type: "array",
          items: {
            type: "object",
            properties: {
              document: { type: "string" },
              mandatory: { type: "boolean" },
              status: { type: "string" }
            },
            required: ["document", "mandatory"],
            additionalProperties: false
          }
        },
        technical_criteria: {
          type: "array",
          items: {
            type: "object",
            properties: {
              criterion: { type: "string" },
              max_marks: { type: "number" },
              minimum_required: { type: "number" }
            },
            required: ["criterion"],
            additionalProperties: false
          }
        },
        risk_assessment: {
          type: "object",
          properties: {
            risk_factors: { type: "array", items: { type: "string" } },
            pre_bid_queries: { type: "array", items: { type: "string" } },
            strategic_notes: { type: "array", items: { type: "string" } }
          },
          required: ["risk_factors", "pre_bid_queries", "strategic_notes"],
          additionalProperties: false
        },
        overall_eligibility: {
          type: "object",
          properties: {
            score: { type: "number" },
            recommendation: { type: "string" },
            missing_data: { type: "array", items: { type: "string" } }
          },
          required: ["score", "recommendation"],
          additionalProperties: false
        },
        documents: { type: "array", items: { type: "string" } },
        experience: { type: "string" },
        turnover: { type: "string" },
        msme_benefits: { type: "array", items: { type: "string" } },
        startup_benefits: { type: "array", items: { type: "string" } },
        summary: { type: "string" }
      },
      required: ["executive_summary", "eligibility_mapping", "compliance_exemptions", "boq_analysis", "document_checklist", "risk_assessment", "overall_eligibility", "documents", "experience", "turnover", "msme_benefits", "startup_benefits", "summary"],
      additionalProperties: false
    }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { pdfText, companyProfile } = await req.json();
    if (!pdfText || typeof pdfText !== 'string') {
      return new Response(JSON.stringify({ error: 'pdfText is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Chunked summarization for very large NITs (>40K chars).
    let workingText = pdfText;
    const chunks = chunkText(pdfText, 40000);
    if (chunks.length > 1) {
      console.log(`[analyze-tender] document is ${pdfText.length} chars, chunking into ${chunks.length} parts`);
      const summaries: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const summaryRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are an Indian tender analyst. Extract ALL critical details verbatim from this chunk: tender ID, issuing authority, EMD/PBG/tender fee, submission deadline, eligibility (turnover, experience, certifications), Make in India clauses, Rule 144(xi), penalties, payment terms, BOQ, technical criteria, document list. Be exhaustive — preserve numbers, dates, percentages, and clause references." },
              { role: "user", content: `Tender chunk ${i + 1} of ${chunks.length}:\n\n${chunks[i]}` }
            ],
          }),
        });
        if (summaryRes.ok) {
          const j = await summaryRes.json();
          summaries.push(j.choices?.[0]?.message?.content || "");
        }
      }
      workingText = summaries.join("\n\n---CHUNK BREAK---\n\n");
      console.log(`[analyze-tender] consolidated to ${workingText.length} chars`);
    }

    const extractionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analyze this Indian tender and produce a comprehensive structured report.\n\nCOMPANY PROFILE:\n${companyProfile ? JSON.stringify(companyProfile) : "Not provided"}\n\nTENDER DOCUMENT:\n${workingText.substring(0, 60000)}` }
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "extract_tender_analysis" } },
        reasoning: { effort: "xhigh" }
      }),
    });

    if (!extractionResponse.ok) {
      if (extractionResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (extractionResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await extractionResponse.text();
      console.error("AI gateway error:", extractionResponse.status, errText);
      throw new Error("AI extraction failed");
    }

    const aiResult = await extractionResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    let requirements: any;
    if (toolCall?.function?.arguments) {
      requirements = JSON.parse(toolCall.function.arguments);
    } else {
      const content = aiResult.choices?.[0]?.message?.content || "";
      try { requirements = JSON.parse(content); }
      catch {
        requirements = { documents: ["Unable to extract"], experience: "Not specified", turnover: "Not specified", msme_benefits: [], startup_benefits: [], summary: content };
      }
    }

    const eligibility = requirements.overall_eligibility ? {
      overall_score: requirements.overall_eligibility.score,
      checks: (requirements.eligibility_mapping || []).map((row: any) => ({
        label: row.requirement,
        eligible: row.gap_action?.toLowerCase().includes("compliant") && !row.gap_action?.toLowerCase().includes("non-compliant"),
        detail: `Tender: ${row.tender_asks} | Company: ${row.company_status} | ${row.gap_action}`
      })),
      recommendation: requirements.overall_eligibility.recommendation,
      risk_factors: requirements.risk_assessment?.risk_factors || [],
      action_items: requirements.risk_assessment?.strategic_notes || [],
      missing_data: requirements.overall_eligibility.missing_data || [],
      pre_bid_queries: requirements.risk_assessment?.pre_bid_queries || []
    } : null;

    requirements.summary = requirements.summary || requirements.executive_summary?.summary || "";
    requirements.tender_value = requirements.executive_summary?.estimated_value || "";
    requirements.deadline = requirements.executive_summary?.submission_deadline || "";
    requirements.emd_amount = requirements.executive_summary?.emd_amount || "";
    requirements.tender_fee = requirements.executive_summary?.tender_fee || "";
    requirements.bid_validity = requirements.executive_summary?.bid_validity || "";
    requirements.pbg_percentage = requirements.boq_analysis?.pbg_requirement || "";

    return new Response(JSON.stringify({ requirements, eligibility }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error("analyze-tender error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
