import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function buildCompanyContext(cp: any): string {
  if (!cp) return "Company details not provided";
  return `
COMPANY DETAILS:
- Company Name: ${cp.company_name || "Not provided"}
- Nature of Business: ${cp.nature_of_business || "Not provided"}
- Year of Incorporation: ${cp.year_of_incorporation || "Not provided"}
- Registered Address: ${cp.address || "Not provided"}
- Office City/Region: ${cp.office_city || "Not provided"}

AUTHORIZED SIGNATORY:
- Name: ${cp.authorized_signatory_name || cp.contact_person || "Not provided"}
- Designation: ${cp.authorized_signatory_designation || "Authorized Signatory"}
- Email: ${cp.contact_email || "Not provided"}
- Phone: ${cp.contact_phone || "Not provided"}

REGISTRATION & TAX:
- PAN: ${cp.pan || "Not provided"}
- TAN: ${cp.tan || "Not provided"}
- GST: ${cp.gst || "Not provided"}
- CIN: ${cp.cin || "Not provided"}
- Udyam/MSME Number: ${cp.udyam_number || "Not provided"}
- DPIIT Recognition Number: ${cp.dpiit_number || "Not provided"}
- MSME Registered: ${cp.msme ? "Yes" : "No"}
- DPIIT Startup: ${cp.startup ? "Yes" : "No"}

EXPERIENCE & CAPACITY:
- Years of Experience: ${cp.years_experience || "Not provided"}
- Annual Turnover: ${cp.annual_turnover || "Not provided"}
- Employees: ${cp.employees_count || "Not provided"}
- Certifications: ${cp.certifications?.length > 0 ? cp.certifications.join(", ") : "None"}
- Past Projects: ${cp.past_projects?.length > 0 ? cp.past_projects.join("; ") : "None"}

MAKE IN INDIA:
- Local Content: ${cp.local_content_percentage || "100"}%

ESCALATION MATRIX:
- Level 1: ${cp.escalation_l1_name || "Not provided"} | ${cp.escalation_l1_email || ""}
- Level 2: ${cp.escalation_l2_name || "Not provided"} | ${cp.escalation_l2_email || ""}
- Level 3: ${cp.escalation_l3_name || "Not provided"} | ${cp.escalation_l3_email || ""}

SUPPORT CENTRE:
- Phone: ${cp.support_phone || cp.contact_phone || "Not provided"}
- Email: ${cp.support_email || cp.contact_email || "Not provided"}

BANKING:
- Bank: ${cp.bank_name || "Not provided"}
- Account: ${cp.bank_account || "Not provided"}
- IFSC: ${cp.ifsc_code || "Not provided"}
`;
}

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
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const companyDetails = buildCompanyContext(companyProfile);
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

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
            content: `You are India's top government tender proposal writer with 25+ years winning GeM, CPPP, state & PSU tenders. You adhere strictly to GFR 2017, CVC guidelines, and Public Procurement (Preference to Make in India) Order.

CRITICAL RULES:
1. Generate ALL documents as SEPARATE SECTIONS clearly marked with "===DOCUMENT: <name>===" delimiter
2. Use company details provided — if "Not provided", write "To be furnished upon request / enclosed separately"
3. Format in clean markdown with tables
4. Indian date format DD/MM/YYYY, amounts in INR with words
5. Include company letterhead format (company name, GST, address, contact) at top of each document
6. Include authorized signatory block at bottom of each document
7. Today's date: ${today}
8. FIRST document MUST be a Covering Letter on company letterhead — this is mandatory for every Indian tender submission`
          },
          {
            role: "user",
            content: `Generate ALL the following SEPARATE tender submission documents for this tender. Each document MUST start with "===DOCUMENT: <name>===" on its own line.

TENDER: ${tenderTitle}
${companyDetails}

TENDER REQUIREMENTS:
${JSON.stringify(requirements, null, 2)}

ELIGIBILITY:
${JSON.stringify(eligibility, null, 2)}

Generate these SEPARATE documents IN ORDER:

===DOCUMENT: Covering Letter===
MANDATORY first document. Formal covering letter on company letterhead addressed to the Tender Issuing Authority. Include:
- Reference to Tender ID/NIT number
- List of enclosed documents
- Declaration of compliance with tender T&C
- Declaration that information is true and correct
- Request for favourable consideration
- Authorized signatory with seal

===DOCUMENT: Letter of Eligibility===
Undertaking & Declaration for Turnover and Experience Criteria Exemption (MSME/Startup India). Include:
- Declaration of MSME/Startup registration
- Exemption claim from turnover & experience criteria as per GeM/GoI policy
- Confirmation of technical capability
- Undertaking that all documents are authentic

===DOCUMENT: Technical Proposal===
COMPLETE Technical Solution Proposal (Envelope-1) with:
- Cover page with project title
- Table of Contents
- Annexure with: Introduction, Understanding of Business Needs, Objectives, Project Scope, Key Components of Proposed Solution, Cyber Security Framework, Compliance & Regulatory Standards, Project Implementation Methodology, Project Milestones, Support & Maintenance, Contact Details
- Detailed technical approach specific to the tender requirements

===DOCUMENT: ATC Undertaking===
Buyer Added Bid Specific Terms and Conditions compliance. For EACH term in the tender, write "Noted & Complied" with company details.

===DOCUMENT: Non-Blacklisting Undertaking===
Declaration that the company is not blacklisted by any Central/State Government/PSU/Regulatory Authority in India or worldwide. Include:
- Not involved in litigation affecting service delivery
- Not blacklisted for fraudulent activities

===DOCUMENT: Legal Proceedings Undertaking===
Undertaking that no legal action, litigation, or proceeding is pending against the company that may affect tender performance.

===DOCUMENT: Make in India Certificate===
Self-declaration as Class-I local supplier with:
- Reference government notifications (P-45021/2/2017-B.E-ll series)
- Local content percentage declaration
- Location of local value addition
- Breach acknowledgment under GFR Rule 175(1)(i)(h)

===DOCUMENT: Office Location Undertaking===
Confirmation of operational office and service & support centre with:
- Head office address details table
- Contact person, phone, email

===DOCUMENT: Support Centre & Escalation Matrix===
Complete support centre details and escalation matrix table with Level I, II, III contacts.

===DOCUMENT: Technical Compliance===
Technical compliance table with Sr. No, Particulars (from tender requirements), Compliance (Y/N), and evidence notes. Cover ALL technical requirements from the tender.

===DOCUMENT: Financial Proposal===
Financial Bid / BOQ with:
- Pricing table: S.No | Item | Unit | Qty | Rate (INR) | Amount (INR)
- GST breakup
- Total in words and figures
- Price validity, payment terms
- EMD details, PBG commitment

===DOCUMENT: Statutory Declarations===
All statutory declarations:
- Self-declaration of non-debarment
- No conflict of interest
- Authenticity of information
- Acceptance of tender T&C

===DOCUMENT: Documents Checklist===
Complete checklist table: S.No | Document | Page No. | Status (Enclosed/To be furnished)

Make each document PROFESSIONAL, COMPLETE, and READY FOR SUBMISSION with proper Indian government formatting. Use the exact company details provided.`
          }
        ],
        reasoning: { effort: "xhigh" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
