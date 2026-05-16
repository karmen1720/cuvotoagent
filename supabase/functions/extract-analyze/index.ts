// supabase/functions/extract-analyze/index.ts
// ------------------------------------------------------------
// This Edge Function accepts a multipart/form-data request containing a PDF file,
// extracts the text using the existing PdfExtraction utility, and then forwards the
// extracted text to the AI pipeline (fetchWithFallback) which will automatically
// fallback to Google Gemini if the primary Lovable AI quota is exhausted.
// ------------------------------------------------------------

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts"; // adjust path if needed
import { extractPdfText, PdfExtractionError } from "../../src/lib/pdf-text.ts";

// Re‑use the fetchWithFallback logic from analyze‑tender (duplicate here for
// independence – you can later extract it to a shared module).
async function fetchWithFallback(payload: any) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  let res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // Fallback when Lovable returns quota errors (402) or rate‑limit (429)
  if (!res.ok && (res.status === 402 || res.status === 429)) {
    if (GEMINI_API_KEY) {
      console.log(`Lovable API returned ${res.status}, GEMINI_API_KEY present. Falling back to Gemini.`);
      res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, model: "gemini-2.5-flash" }),
      });
    } else {
      console.warn("GEMINI_API_KEY not configured – cannot fallback.");
      // Propagate the original error response
      return res;
    }
  }
  return res;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    // ----- Authentication -----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;
    const emailVerified = (claimsData.claims as any).email_verified !== false;
    if (!emailVerified) {
      return new Response(JSON.stringify({ error: "Please verify your email to use AI features." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ----- Parse multipart/form-data -----
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(JSON.stringify({ error: "Expected multipart/form-data with a PDF file." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: "Missing PDF file in request." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ----- Extract PDF text -----
    let pdfText: string;
    try {
      pdfText = await extractPdfText(file);
    } catch (e) {
      if (e instanceof PdfExtractionError) {
        return new Response(JSON.stringify({ error: e.message, code: e.code }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("PDF extraction error:", e);
      return new Response(JSON.stringify({ error: "Failed to extract PDF text." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ----- Minimal payload for Gemini analysis -----
    const payload = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are an AI assistant that extracts key information from Indian tender documents." },
        { role: "user", content: pdfText },
      ],
      // you can add any additional fields required by your existing pipeline
    };

    const aiRes = await fetchWithFallback(payload);
    const result = await aiRes.json();
    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
