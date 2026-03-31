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

    // Extract requirements using AI
    const extractionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are a tender document analyst. Extract structured requirements from tender documents. Always respond with valid JSON using the exact schema provided via tool calling.`
          },
          {
            role: "user",
            content: `Analyze this tender document and extract all requirements:\n\n${pdfText.substring(0, 8000)}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_tender_requirements",
              description: "Extract structured requirements from a tender document",
              parameters: {
                type: "object",
                properties: {
                  documents: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of required documents"
                  },
                  experience: {
                    type: "string",
                    description: "Minimum experience requirement"
                  },
                  turnover: {
                    type: "string",
                    description: "Minimum turnover requirement"
                  },
                  msme_benefits: {
                    type: "array",
                    items: { type: "string" },
                    description: "Benefits available for MSME registered companies"
                  },
                  startup_benefits: {
                    type: "array",
                    items: { type: "string" },
                    description: "Benefits available for DPIIT recognized startups"
                  },
                  tender_value: {
                    type: "string",
                    description: "Estimated tender value if mentioned"
                  },
                  deadline: {
                    type: "string",
                    description: "Submission deadline if mentioned"
                  },
                  summary: {
                    type: "string",
                    description: "Brief summary of the tender scope"
                  }
                },
                required: ["documents", "experience", "turnover", "msme_benefits", "startup_benefits", "summary"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_tender_requirements" } }
      }),
    });

    if (!extractionResponse.ok) {
      if (extractionResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (extractionResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
      // Fallback: try to parse from content
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

    // Now check eligibility against company profile
    let eligibility = null;
    if (companyProfile) {
      const eligibilityResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are an eligibility assessment expert for government and corporate tenders. Evaluate company eligibility against tender requirements."
            },
            {
              role: "user",
              content: `Assess eligibility:\n\nTender Requirements:\n${JSON.stringify(requirements)}\n\nCompany Profile:\n${JSON.stringify(companyProfile)}`
            }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "assess_eligibility",
                description: "Assess company eligibility for a tender",
                parameters: {
                  type: "object",
                  properties: {
                    overall_score: {
                      type: "number",
                      description: "Overall eligibility score from 0-100"
                    },
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
                    recommendation: {
                      type: "string",
                      description: "Overall recommendation - should the company bid?"
                    }
                  },
                  required: ["overall_score", "checks", "recommendation"],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "assess_eligibility" } }
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
