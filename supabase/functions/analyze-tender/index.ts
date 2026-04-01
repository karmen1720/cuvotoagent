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
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const gatewayHeaders = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    };

    // Extract requirements using deep-reasoning AI
    const extractionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: gatewayHeaders,
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `You are an expert Indian government tender document analyst with deep knowledge of:
- GeM (Government e-Marketplace) tenders
- CPPP (Central Public Procurement Portal) requirements
- State government tender portals
- PSU and corporate tender formats
- Indian tender compliance requirements (EMD, PBG, Turnover, Experience)
- GFR (General Financial Rules) requirements
- MSME & Startup India policy benefits

Extract ALL requirements meticulously. Pay special attention to:
1. Earnest Money Deposit (EMD) amount and exemptions
2. Performance Bank Guarantee (PBG) requirements
3. Tender fee and processing charges
4. Pre-qualification criteria
5. Technical evaluation criteria with marks/weightage
6. Financial bid format requirements
7. Submission deadline with exact date/time
8. Pre-bid meeting dates
9. Bid validity period
10. Warranty/AMC requirements

Always respond with valid JSON using the tool calling format.`
          },
          {
            role: "user",
            content: `Analyze this Indian tender document thoroughly and extract every requirement:\n\n${pdfText.substring(0, 12000)}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_tender_requirements",
              description: "Extract comprehensive structured requirements from an Indian tender document",
              parameters: {
                type: "object",
                properties: {
                  documents: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of ALL required documents (PAN card, GST certificate, ITR, balance sheets, experience certificates, EMD, tender fee receipt, etc.)"
                  },
                  experience: { type: "string", description: "Minimum experience requirement in years and type" },
                  turnover: { type: "string", description: "Minimum annual turnover requirement with financial years" },
                  emd_amount: { type: "string", description: "Earnest Money Deposit amount and mode of payment" },
                  tender_fee: { type: "string", description: "Tender document fee amount" },
                  pbg_percentage: { type: "string", description: "Performance Bank Guarantee percentage and validity" },
                  bid_validity: { type: "string", description: "Bid validity period in days" },
                  pre_bid_date: { type: "string", description: "Pre-bid meeting date if mentioned" },
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
                    description: "Technical evaluation criteria with marks"
                  },
                  msme_benefits: {
                    type: "array",
                    items: { type: "string" },
                    description: "Benefits available for MSME registered companies (EMD exemption, purchase preference, etc.)"
                  },
                  startup_benefits: {
                    type: "array",
                    items: { type: "string" },
                    description: "Benefits for DPIIT recognized startups (prior experience relaxation, turnover relaxation, etc.)"
                  },
                  tender_value: { type: "string", description: "Estimated tender value / contract amount" },
                  deadline: { type: "string", description: "Submission deadline with date and time" },
                  summary: { type: "string", description: "Detailed summary of the tender scope, deliverables, and timeline" },
                  scope_of_work: {
                    type: "array",
                    items: { type: "string" },
                    description: "Detailed scope of work items"
                  },
                  payment_terms: { type: "string", description: "Payment terms and schedule" },
                  warranty_amc: { type: "string", description: "Warranty and AMC requirements" },
                  penalties: { type: "string", description: "Penalty clauses for delay or non-compliance" }
                },
                required: ["documents", "experience", "turnover", "msme_benefits", "startup_benefits", "summary"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_tender_requirements" } },
        reasoning: { effort: "high" }
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

    // Eligibility check with deep analysis
    let eligibility = null;
    if (companyProfile) {
      const eligibilityResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: gatewayHeaders,
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            {
              role: "system",
              content: `You are an expert Indian tender eligibility assessor. Evaluate EVERY criterion strictly:

1. Check turnover against minimum requirements (compare actual numbers)
2. Check years of experience against minimum requirements
3. Verify all mandatory documents availability
4. Check MSME/Startup benefits applicability
5. EMD exemption eligibility
6. Technical capability match
7. Geographical/sector restrictions
8. Past experience relevance
9. Certification requirements (ISO, CMMI, etc.)
10. Consortium/JV requirements if any
11. Blacklisting/debarment check
12. Submission deadline feasibility

Be strict - if data is missing, mark as NOT eligible for that criterion.
Score realistically - don't inflate scores.`
            },
            {
              role: "user",
              content: `Assess eligibility thoroughly:\n\nTender Requirements:\n${JSON.stringify(requirements)}\n\nCompany Profile:\n${JSON.stringify(companyProfile)}`
            }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "assess_eligibility",
                description: "Detailed eligibility assessment for Indian tender",
                parameters: {
                  type: "object",
                  properties: {
                    overall_score: { type: "number", description: "Eligibility score 0-100" },
                    checks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          label: { type: "string" },
                          eligible: { type: "boolean" },
                          detail: { type: "string" }
                        },
                        required: ["label", "eligible", "detail"],
                        additionalProperties: false
                      }
                    },
                    recommendation: { type: "string", description: "Clear recommendation: BID / CONDITIONAL BID / DO NOT BID with reasons" },
                    risk_factors: {
                      type: "array",
                      items: { type: "string" },
                      description: "Key risk factors to consider"
                    },
                    action_items: {
                      type: "array",
                      items: { type: "string" },
                      description: "Immediate action items before submission"
                    }
                  },
                  required: ["overall_score", "checks", "recommendation"],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "assess_eligibility" } },
          reasoning: { effort: "high" }
        }),
      });

      if (eligibilityResponse.ok) {
        const eligResult = await eligibilityResponse.json();
        const eligToolCall = eligResult.choices?.[0]?.message?.tool_calls?.[0];
        if (eligToolCall?.function?.arguments) {
          eligibility = JSON.parse(eligToolCall.function.arguments);
        }
      }
    }

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
