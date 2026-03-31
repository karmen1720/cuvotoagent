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
    const { tenderTitle, requirements, eligibility, companyProfile } = await req.json();

    if (!tenderTitle) {
      return new Response(JSON.stringify({ error: 'tenderTitle is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are a professional tender proposal writer. Generate comprehensive, well-structured tender proposals that are professional, detailed, and persuasive. Write in formal business language. Format the proposal with clear sections using markdown headings.`
          },
          {
            role: "user",
            content: `Generate a professional tender proposal for:

Tender: ${tenderTitle}

Company: ${JSON.stringify(companyProfile)}

Requirements Extracted: ${JSON.stringify(requirements)}

Eligibility Assessment: ${JSON.stringify(eligibility)}

Create a complete proposal with these sections:
1. Cover Letter
2. Executive Summary
3. Company Profile & Qualifications
4. Technical Approach & Methodology
5. Compliance Matrix (addressing each requirement)
6. Value Proposition (highlighting MSME/Startup benefits if applicable)
7. Timeline & Deliverables
8. Conclusion

Make it professional, detailed, and persuasive.`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("Proposal generation failed");
    }

    const result = await response.json();
    const proposalText = result.choices?.[0]?.message?.content || "Failed to generate proposal";

    return new Response(JSON.stringify({ proposal: proposalText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error("generate-proposal error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
