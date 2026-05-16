import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an elite AI Tender & Public Procurement Consultant for the Indian market with 25+ years of experience across GeM, CPPP, IREPS, NIC State portals, MSTC and PSU procurement.

EXPERTISE:
- GFR 2017 + 2022/2023 amendments (Bid Security Declaration replaces EMD in many categories)
- CVC guidelines, Public Procurement (Preference to Make in India) Order 2017 + 2023 revision
- MSME definition revision (composite investment + turnover criteria)
- DPIIT Startup recognition criteria for procurement exemption
- Rule 144(xi) GFR — land border country restrictions
- Class-I (>50% local) vs Class-II (>20%) MII purchase preference rules
- QCBS / L1 / Two-Bid evaluation methodologies

CRITICAL RULES:
1. Extract EVERY requirement meticulously — never fabricate
2. If a field is not in the document, set "Not specified in document"
3. Map company profile against tender requirements strictly — call out gaps
4. Flag Rule 144(xi) disqualifications
5. Identify ALL penalty/LD clauses, termination risks, restrictive specs
6. Draft 2-3 strategic pre-bid queries`;

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
            tender_id: { type: "string" }, issuing_authority: { type: "string" },
            tender_type: { type: "string" }, estimated_value: { type: "string" },
            emd_amount: { type: "string" }, tender_fee: { type: "string" },
            submission_deadline: { type: "string" }, bid_opening_date: { type: "string" },
            pre_bid_date: { type: "string" }, bid_validity: { type: "string" },
            summary: { type: "string" },
          },
          required: ["tender_id", "issuing_authority", "tender_type", "estimated_value", "submission_deadline", "summary"],
          additionalProperties: false,
        },
        eligibility_mapping: {
          type: "array",
          items: {
            type: "object",
            properties: {
              requirement: { type: "string" }, tender_asks: { type: "string" },
              company_status: { type: "string" }, gap_action: { type: "string" },
            },
            required: ["requirement", "tender_asks", "company_status", "gap_action"],
            additionalProperties: false,
          },
        },
        compliance_exemptions: {
          type: "object",
          properties: {
            msme_analysis: { type: "string" }, startup_analysis: { type: "string" },
            make_in_india: { type: "string" }, rule_144_xi: { type: "string" },
            bid_security_declaration: { type: "string" }, three_year_turnover: { type: "string" },
            experience_relaxation: { type: "string" },
            other_exemptions: { type: "array", items: { type: "string" } },
          },
          required: ["msme_analysis", "startup_analysis", "make_in_india"],
          additionalProperties: false,
        },
        boq_analysis: {
          type: "object",
          properties: {
            scope_items: { type: "array", items: { type: "string" } },
            restrictive_specs: { type: "array", items: { type: "string" } },
            payment_terms: { type: "string" }, pbg_requirement: { type: "string" },
            warranty_amc: { type: "string" }, penalties_ld: { type: "string" },
            subletting_clause: { type: "string" },
          },
          required: ["scope_items", "payment_terms", "pbg_requirement"],
          additionalProperties: false,
        },
        document_checklist: {
          type: "array",
          items: {
            type: "object",
            properties: { document: { type: "string" }, mandatory: { type: "boolean" }, status: { type: "string" } },
            required: ["document", "mandatory"], additionalProperties: false,
          },
        },
        technical_criteria: {
          type: "array",
          items: {
            type: "object",
            properties: { criterion: { type: "string" }, max_marks: { type: "number" }, minimum_required: { type: "number" } },
            required: ["criterion"], additionalProperties: false,
          },
        },
        risk_assessment: {
          type: "object",
          properties: {
            risk_factors: { type: "array", items: { type: "string" } },
            pre_bid_queries: { type: "array", items: { type: "string" } },
            strategic_notes: { type: "array", items: { type: "string" } },
          },
          required: ["risk_factors", "pre_bid_queries", "strategic_notes"],
          additionalProperties: false,
        },
        overall_eligibility: {
          type: "object",
          properties: {
            score: { type: "number" }, recommendation: { type: "string" },
            missing_data: { type: "array", items: { type: "string" } },
          },
          required: ["score", "recommendation"], additionalProperties: false,
        },
        documents: { type: "array", items: { type: "string" } },
        experience: { type: "string" }, turnover: { type: "string" },
        msme_benefits: { type: "array", items: { type: "string" } },
        startup_benefits: { type: "array", items: { type: "string" } },
        summary: { type: "string" },
      },
      required: ["executive_summary", "eligibility_mapping", "compliance_exemptions", "boq_analysis", "document_checklist", "risk_assessment", "overall_eligibility", "documents", "experience", "turnover", "msme_benefits", "startup_benefits", "summary"],
      additionalProperties: false,
    },
  },
};

type AnalysisPayload = {
  tenderId: string;
  pdfText: string;
  companyProfile?: Record<string, unknown> | null;
  orgId: string;
  userId: string;
};

function chunkText(text: string, chunkSize = 40000): string[] {
  if (text.length <= chunkSize) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) chunks.push(text.slice(i, i + chunkSize));
  return chunks;
}

function jobState(status: "processing" | "failed", extra: Record<string, unknown> = {}) {
  return {
    _job: {
      type: "analysis",
      status,
      ...extra,
    },
  };
}

async function fetchWithFallback(payload: any) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  let res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok && (res.status === 402 || res.status === 429) && GEMINI_API_KEY) {
    console.log(`Lovable API returned ${res.status}, falling back to free Gemini API`);
    res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, model: "gemini-2.5-flash" }),
    });
  }

  return res;
}

async function runAnalysis(admin: ReturnType<typeof createClient>, payload: AnalysisPayload) {
  const { tenderId, pdfText, companyProfile, orgId, userId } = payload;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  try {
    let workingText = pdfText;
    const chunks = chunkText(pdfText, 40000);
    if (chunks.length > 1) {
      const summaries: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const summaryRes = await fetchWithFallback({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are an Indian tender analyst. Extract all critical tender details from this chunk only." },
            { role: "user", content: `Tender chunk ${i + 1} of ${chunks.length}:\n\n${chunks[i]}` },
          ],
          reasoning: { effort: "low" },
        });

        if (!summaryRes.ok) {
          const errText = await summaryRes.text();
          console.error("chunk summary error:", summaryRes.status, errText);
          throw new Error(summaryRes.status === 429 ? "AI rate limit exceeded. Try again in a moment." : "Tender chunk summarization failed");
        }

        const summaryJson = await summaryRes.json();
        summaries.push(summaryJson.choices?.[0]?.message?.content || "");
      }
      workingText = summaries.join("\n\n---CHUNK BREAK---\n\n");
    }

    const extractionResponse = await fetchWithFallback({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze this Indian tender.\n\nCOMPANY PROFILE:\n${companyProfile ? JSON.stringify(companyProfile) : "Not provided"}\n\nTENDER DOCUMENT:\n${workingText.substring(0, 60000)}`,
        },
      ],
      tools: [TOOL_SCHEMA],
      tool_choice: { type: "function", function: { name: "extract_tender_analysis" } },
      reasoning: { effort: "low" },
    });

    if (!extractionResponse.ok) {
      const errText = await extractionResponse.text();
      console.error("AI gateway error:", extractionResponse.status, errText);
      if (extractionResponse.status === 429) throw new Error("AI rate limit exceeded. Try again in a moment.");
      if (extractionResponse.status === 402) throw new Error("AI credits exhausted. Add funds in Workspace Usage.");
      throw new Error("AI extraction failed");
    }

    const aiResult = await extractionResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    const tokensUsed = aiResult.usage?.total_tokens || 0;

    let requirements: any;
    if (toolCall?.function?.arguments) {
      requirements = JSON.parse(toolCall.function.arguments);
    } else {
      const content = aiResult.choices?.[0]?.message?.content || "";
      try {
        requirements = JSON.parse(content);
      } catch {
        requirements = {
          documents: ["Unable to extract"],
          experience: "Not specified",
          turnover: "Not specified",
          msme_benefits: [],
          startup_benefits: [],
          summary: content,
        };
      }
    }

    const eligibility = requirements.overall_eligibility ? {
      overall_score: requirements.overall_eligibility.score,
      checks: (requirements.eligibility_mapping || []).map((row: any) => ({
        label: row.requirement,
        eligible: row.gap_action?.toLowerCase().includes("compliant") && !row.gap_action?.toLowerCase().includes("non-compliant"),
        detail: `Tender: ${row.tender_asks} | Company: ${row.company_status} | ${row.gap_action}`,
      })),
      recommendation: requirements.overall_eligibility.recommendation,
      risk_factors: requirements.risk_assessment?.risk_factors || [],
      action_items: requirements.risk_assessment?.strategic_notes || [],
      missing_data: requirements.overall_eligibility.missing_data || [],
      pre_bid_queries: requirements.risk_assessment?.pre_bid_queries || [],
    } : null;

    requirements.summary = requirements.summary || requirements.executive_summary?.summary || "";
    requirements.tender_value = requirements.executive_summary?.estimated_value || "";
    requirements.deadline = requirements.executive_summary?.submission_deadline || "";
    requirements.emd_amount = requirements.executive_summary?.emd_amount || "";
    requirements.tender_fee = requirements.executive_summary?.tender_fee || "";
    requirements.bid_validity = requirements.executive_summary?.bid_validity || "";
    requirements.pbg_percentage = requirements.boq_analysis?.pbg_requirement || "";

    const { error: updateError } = await admin
      .from("tenders")
      .update({
        raw_requirements: requirements,
        eligibility,
        stage: "bid_prep",
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenderId)
      .eq("organization_id", orgId);
    if (updateError) throw updateError;

    const { error: usageError } = await admin.from("usage_events").insert({
      organization_id: orgId,
      user_id: userId,
      event_type: "analyze_tender",
      tokens_used: tokensUsed,
      tender_id: tenderId,
    });
    if (usageError) console.error("usage log failed", usageError);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown analysis error";
    console.error("analyze-tender background error:", error);
    await admin
      .from("tenders")
      .update({
        raw_requirements: jobState("failed", { failedAt: new Date().toISOString(), error: message }),
        eligibility: jobState("failed", { failedAt: new Date().toISOString(), error: message }),
        stage: "new",
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenderId)
      .eq("organization_id", orgId);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const emailVerified = (claimsData.claims as any).email_verified !== false;
    const { pdfText, companyProfile, orgId, tenderId } = await req.json();

    if (!pdfText || typeof pdfText !== "string" || pdfText.length < 200) {
      return new Response(JSON.stringify({ error: "Tender text is too short or missing" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!orgId) {
      return new Response(JSON.stringify({ error: "orgId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!tenderId) {
      return new Response(JSON.stringify({ error: "tenderId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!emailVerified) {
      return new Response(JSON.stringify({ error: "Please verify your email to use AI features." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: member } = await admin
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!member) {
      return new Response(JSON.stringify({ error: "You are not a member of this workspace." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tender } = await admin
      .from("tenders")
      .select("id")
      .eq("id", tenderId)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!tender) {
      return new Response(JSON.stringify({ error: "Tender record not found." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    console.log("GEMINI_API_KEY present:", !!GEMINI_API_KEY);
    // Fetch quota information from Supabase
    const { data: quotaData } = await admin.rpc("org_ai_quota_remaining", { _org_id: orgId });
    const quota = quotaData as any;
    if (!quota?.allowed) {
      if (GEMINI_API_KEY) {
        console.warn(`Quota exceeded for Lovable, but GEMINI_API_KEY is present. Continuing with Gemini fallback.`);
        // Continue; fetchWithFallback will handle fallback.
      } else {
        const reason = quota?.reason === "trial_expired"
          ? "Your trial has expired. Upgrade to continue using AI."
          : `Monthly AI quota reached (${quota?.used}/${quota?.limit}). Upgrade your plan to continue.`;
        return new Response(JSON.stringify({ error: reason, quota }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const startedAt = new Date().toISOString();
    const processingState = jobState("processing", { startedAt });
    const { error: queueError } = await admin
      .from("tenders")
      .update({
        raw_requirements: processingState,
        eligibility: processingState,
        stage: "screening",
        updated_at: startedAt,
      })
      .eq("id", tenderId)
      .eq("organization_id", orgId);
    if (queueError) throw queueError;

    EdgeRuntime.waitUntil(runAnalysis(admin, { tenderId, pdfText, companyProfile, orgId, userId }));

    return new Response(JSON.stringify({ accepted: true, tenderId, status: "processing" }), {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-tender error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
