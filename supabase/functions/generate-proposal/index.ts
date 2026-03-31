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

    // Build comprehensive company details section
    const companyDetails = companyProfile ? `
COMPANY DETAILS:
- Company Name: ${companyProfile.company_name || "Not provided"}
- Contact Person: ${companyProfile.contact_person || "Not provided"}
- Email: ${companyProfile.contact_email || "Not provided"}
- Phone: ${companyProfile.contact_phone || "Not provided"}
- Registered Address: ${companyProfile.address || "Not provided"}

REGISTRATION & TAX DETAILS:
- PAN: ${companyProfile.pan || "Not provided"}
- TAN: ${companyProfile.tan || "Not provided"}
- GST Number: ${companyProfile.gst || "Not provided"}
- CIN: ${companyProfile.cin || "Not provided"}
- MSME/Udyam Number: ${companyProfile.udyam_number || "Not provided"}
- DPIIT Recognition Number: ${companyProfile.dpiit_number || "Not provided"}
- MSME Registered: ${companyProfile.msme ? "Yes" : "No"}
- DPIIT Recognized Startup: ${companyProfile.startup ? "Yes" : "No"}

EXPERIENCE & CAPACITY:
- Years of Experience: ${companyProfile.years_experience || "Not provided"}
- Annual Turnover: ${companyProfile.annual_turnover || "Not provided"}
- Number of Employees: ${companyProfile.employees_count || "Not provided"}
- Certifications: ${companyProfile.certifications?.length > 0 ? companyProfile.certifications.join(", ") : "None listed"}
- Past Projects: ${companyProfile.past_projects?.length > 0 ? companyProfile.past_projects.join("; ") : "None listed"}

BANKING DETAILS:
- Bank: ${companyProfile.bank_name || "Not provided"}
- Account: ${companyProfile.bank_account || "Not provided"}
- IFSC: ${companyProfile.ifsc_code || "Not provided"}
` : "Company details not provided";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `You are an elite government & corporate tender proposal writer with 20+ years of experience winning competitive bids. You write proposals that are:
- Professionally formatted with proper business language
- Compliant with all tender requirements
- Persuasive and highlighting competitive advantages
- Detailed with specific facts, figures, and credentials
- Properly structured following standard tender response formats

You MUST include all company registration details (PAN, TAN, GST, MSME, DPIIT numbers) wherever relevant in the proposal. If certain details are marked "Not provided", mention them as "To be furnished upon request" instead of leaving gaps.

Format the proposal in clean markdown with proper headings, tables where appropriate, and professional language suitable for government/corporate submission.`
          },
          {
            role: "user",
            content: `Generate a comprehensive, submission-ready tender proposal.

TENDER TITLE: ${tenderTitle}

${companyDetails}

TENDER REQUIREMENTS EXTRACTED:
${JSON.stringify(requirements, null, 2)}

ELIGIBILITY ASSESSMENT:
${JSON.stringify(eligibility, null, 2)}

Generate a COMPLETE proposal with these sections:

1. **COVER LETTER** - Formal letter addressed to the tendering authority, expressing interest and summarizing qualifications. Include company PAN, GST, and registration numbers.

2. **EXECUTIVE SUMMARY** - Overview of the proposal, key strengths, and why this company should be selected.

3. **COMPANY PROFILE & CREDENTIALS**
   - About the company, history, vision
   - Registration details (PAN, TAN, GST, CIN, MSME/Udyam, DPIIT)
   - Key personnel and organizational structure
   - Infrastructure and capabilities

4. **TECHNICAL APPROACH & METHODOLOGY**
   - Understanding of the tender scope
   - Proposed approach and methodology
   - Technology stack and tools (if applicable)
   - Quality assurance measures

5. **COMPLIANCE MATRIX** - Table format showing each requirement and how the company complies.

6. **PAST EXPERIENCE & REFERENCES**
   - Relevant past projects
   - Client testimonials approach
   - Similar work undertaken

7. **ELIGIBILITY & SPECIAL BENEFITS**
   - MSME benefits and exemptions applicable
   - Startup benefits and relaxations
   - EMD exemptions if applicable
   - Any price preferences

8. **FINANCIAL PROPOSAL FRAMEWORK**
   - Pricing approach (placeholder for actual figures)
   - Cost breakdown structure
   - Payment terms

9. **TIMELINE & DELIVERABLES**
   - Project timeline with milestones
   - Key deliverables
   - Resource allocation plan

10. **ANNEXURES CHECKLIST**
    - List all documents to be attached
    - Status of each document (Available/To be furnished)

11. **DECLARATION & UNDERTAKING**
    - Standard declaration of authenticity
    - No blacklisting declaration
    - Conflict of interest declaration

Make it professional, comprehensive, and ready for submission. Use tables for compliance matrix and checklists.`
          }
        ],
        reasoning: {
          effort: "high"
        }
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
