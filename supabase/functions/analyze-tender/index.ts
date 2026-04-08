import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfText, companyProfile } = await req.json();

    if (!pdfText || typeof pdfText !== 'string') {
      return new Response(JSON.stringify({ error: 'pdfText is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const gatewayHeaders = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    };

    const extractionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: gatewayHeaders,
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `You are an expert AI Tender & Public Procurement Consultant for the Indian market. You have deep expertise in:
- GFR 2017, CVC guidelines, Public Procurement (Preference to Make in India) Order
- GeM, CPPP, State e-Procurement portals
- MSME & Startup India policy benefits (EMD/fee waivers, purchase preference, turnover/experience relaxation)
- Rule 144(xi) GFR: land border/security restrictions
- Technical & Financial bid evaluation methodologies

CRITICAL RULES:
1. Extract EVERY requirement meticulously — do NOT assume or fabricate data
2. If a field is not found in the document, set it as "Not specified in document"
3. For eligibility mapping, compare company profile against tender requirements strictly
4. Classify Make in India status: Class-I (>50% local content) or Class-II (>20%)
5. Identify ALL penalty/LD clauses and termination risks
6. Draft 2-3 strategic pre-bid queries for ambiguous or exclusionary requirements

Always respond with valid JSON using the tool calling format.`
          },
          {
            role: "user",
            content: `Analyze this Indian tender document and produce a COMPREHENSIVE structured report.

COMPANY PROFILE (for eligibility mapping):
${companyProfile ? JSON.stringify(companyProfile) : "Not provided — skip eligibility mapping"}

TENDER DOCUMENT TEXT:
${pdfText.substring(0, 15000)}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_tender_analysis",
              description: "Produce a comprehensive Indian tender analysis report",
              parameters: {
                type: "object",
                properties: {
                  executive_summary: {
                    type: "object",
                    properties: {
                      tender_id: { type: "string", description: "Tender ID / Reference Number" },
                      issuing_authority: { type: "string", description: "Issuing authority / organization name" },
                      tender_type: { type: "string", description: "Open/Limited/Single/Two-Bid/e-Reverse Auction" },
                      estimated_value: { type: "string", description: "Estimated contract value in INR" },
                      emd_amount: { type: "string", description: "EMD amount and mode of payment" },
                      tender_fee: { type: "string", description: "Tender document fee" },
                      submission_deadline: { type: "string", description: "Last date & time for submission (DD/MM/YYYY HH:MM)" },
                      bid_opening_date: { type: "string", description: "Technical bid opening date" },
                      pre_bid_date: { type: "string", description: "Pre-bid meeting date if any" },
                      bid_validity: { type: "string", description: "Bid validity period" },
                      summary: { type: "string", description: "2-3 line scope summary of what the tender is about" }
                    },
                    required: ["tender_id", "issuing_authority", "tender_type", "estimated_value", "submission_deadline", "summary"],
                    additionalProperties: false
                  },
                  eligibility_mapping: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        requirement: { type: "string", description: "Tender requirement (e.g. Min. Avg. Turnover)" },
                        tender_asks: { type: "string", description: "What the tender demands" },
                        company_status: { type: "string", description: "Company's current status from profile or 'Data not provided'" },
                        gap_action: { type: "string", description: "Compliant / Non-Compliant / Action Required with detail" }
                      },
                      required: ["requirement", "tender_asks", "company_status", "gap_action"],
                      additionalProperties: false
                    },
                    description: "Row-by-row eligibility mapping table"
                  },
                  compliance_exemptions: {
                    type: "object",
                    properties: {
                      msme_analysis: { type: "string", description: "MSME benefits: EMD waiver, fee waiver, purchase preference, turnover/experience relaxation" },
                      startup_analysis: { type: "string", description: "Startup India DPIIT benefits: prior experience & turnover relaxation" },
                      make_in_india: { type: "string", description: "PPP-MII classification: Class-I (>50%) or Class-II (>20%), purchase preference explanation" },
                      rule_144_xi: { type: "string", description: "Land border / security restriction check under GFR Rule 144(xi)" },
                      other_exemptions: { type: "array", items: { type: "string" }, description: "Any other exemptions or special provisions" }
                    },
                    required: ["msme_analysis", "startup_analysis", "make_in_india"],
                    additionalProperties: false
                  },
                  boq_analysis: {
                    type: "object",
                    properties: {
                      scope_items: { type: "array", items: { type: "string" }, description: "Breakdown of goods/services required" },
                      restrictive_specs: { type: "array", items: { type: "string" }, description: "Any restrictive or brand-specific specifications" },
                      payment_terms: { type: "string", description: "Payment schedule and terms" },
                      pbg_requirement: { type: "string", description: "Performance Bank Guarantee details" },
                      warranty_amc: { type: "string", description: "Warranty and AMC requirements" },
                      penalties_ld: { type: "string", description: "Liquidated Damages / penalty clauses" }
                    },
                    required: ["scope_items", "payment_terms", "pbg_requirement"],
                    additionalProperties: false
                  },
                  document_checklist: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        document: { type: "string", description: "Document name" },
                        mandatory: { type: "boolean", description: "Whether this document is mandatory" },
                        status: { type: "string", description: "Can be assessed from company profile: Available / Not Available / To Be Arranged" }
                      },
                      required: ["document", "mandatory"],
                      additionalProperties: false
                    },
                    description: "Complete list of required documents for submission"
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
                    },
                    description: "Technical evaluation criteria with marks/weightage"
                  },
                  risk_assessment: {
                    type: "object",
                    properties: {
                      risk_factors: { type: "array", items: { type: "string" }, description: "Key risk factors: LD clauses, termination risks, onerous terms" },
                      pre_bid_queries: { type: "array", items: { type: "string" }, description: "2-3 strategic pre-bid queries to clarify ambiguities or exclusionary requirements" },
                      strategic_notes: { type: "array", items: { type: "string" }, description: "Strategic action items and recommendations" }
                    },
                    required: ["risk_factors", "pre_bid_queries", "strategic_notes"],
                    additionalProperties: false
                  },
                  overall_eligibility: {
                    type: "object",
                    properties: {
                      score: { type: "number", description: "Overall eligibility score 0-100" },
                      recommendation: { type: "string", description: "BID / CONDITIONAL BID / DO NOT BID with clear reasons" },
                      missing_data: { type: "array", items: { type: "string" }, description: "List of missing data points needed to confirm full eligibility" }
                    },
                    required: ["score", "recommendation"],
                    additionalProperties: false
                  },
                  // Legacy fields for backward compatibility
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
          }
        ],
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

    let requirements;
    if (toolCall?.function?.arguments) {
      requirements = JSON.parse(toolCall.function.arguments);
    } else {
      const content = aiResult.choices?.[0]?.message?.content || "";
      try {
        requirements = JSON.parse(content);
      } catch {
        requirements = {
          documents: ["Unable to extract - please check document"],
          experience: "Not specified",
          turnover: "Not specified",
          msme_benefits: [],
          startup_benefits: [],
          summary: content || "Could not parse tender requirements"
        };
      }
    }

    // Build eligibility from the new structured output
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

    // Merge legacy fields for backward compat
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
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
