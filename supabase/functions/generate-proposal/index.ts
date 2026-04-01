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
            content: `You are India's top government tender proposal writer with 25+ years experience winning GeM, CPPP, state government, and PSU tenders. You have deep expertise in:

- GFR (General Financial Rules) 2017 compliance
- CVC (Central Vigilance Commission) guidelines
- Make in India / Atmanirbhar Bharat procurement policies
- MSME Purchase Preference Policy (PPP-MII Order)
- Startup India procurement benefits
- GeM bid response best practices
- CPPP two-envelope bidding systems

Your proposals are:
- Fully compliant with Indian government tender response formats
- Written in formal Indian business English
- Include all statutory declarations and undertakings as per GFR
- Reference specific government circulars and policies
- Include properly formatted compliance matrices
- Have correct Indian date formats (DD/MM/YYYY)
- Quote amounts in INR with words (e.g., "Rs. 50,00,000/- (Rupees Fifty Lakhs Only)")
- Include proper stamp duty and notarization references

CRITICAL RULES:
1. Include ALL company registration details (PAN, TAN, GST, MSME, DPIIT) with proper formatting
2. If details are "Not provided", write "To be furnished upon request / enclosed separately"
3. Format the proposal in clean markdown with tables for compliance matrix
4. Use Indian Standard numbering and referencing
5. Include Technical Proposal AND Financial Proposal sections separately
6. Add proper annexure references throughout`
          },
          {
            role: "user",
            content: `Generate a COMPLETE, submission-ready tender proposal as per Indian government standards.

TENDER TITLE: ${tenderTitle}

${companyDetails}

TENDER REQUIREMENTS EXTRACTED:
${JSON.stringify(requirements, null, 2)}

ELIGIBILITY ASSESSMENT:
${JSON.stringify(eligibility, null, 2)}

Generate a COMPREHENSIVE proposal with these sections following Indian tender format:

## PART A: TECHNICAL PROPOSAL (ENVELOPE-1)

1. **COVERING LETTER / BID SUBMISSION LETTER**
   - On company letterhead format
   - Addressed to the tendering authority
   - Reference tender number, date, and title
   - Declaration of acceptance of all terms
   - Authorized signatory details with designation
   - Company seal reference

2. **EXECUTIVE SUMMARY**
   - Brief overview of understanding
   - Key differentiators and value proposition
   - Summary of relevant experience

3. **COMPANY PROFILE & CREDENTIALS**
   - Company overview, year of incorporation, nature of business
   - Registration details table (PAN, TAN, GST, CIN, MSME/Udyam, DPIIT)
   - Organizational structure and key management team
   - Infrastructure details
   - Quality certifications with validity

4. **PRE-QUALIFICATION / ELIGIBILITY COMPLIANCE**
   - Compliance table: Requirement | Status | Document Reference
   - Each eligibility criterion mapped to evidence

5. **TECHNICAL APPROACH & METHODOLOGY**
   - Understanding of the scope of work
   - Proposed methodology (step-by-step)
   - Technology/tools to be deployed
   - Quality assurance framework
   - Risk mitigation plan

6. **RESOURCE DEPLOYMENT PLAN**
   - Team structure with CVs of key personnel
   - Roles and responsibilities matrix
   - Equipment/infrastructure deployment

7. **PAST EXPERIENCE & TRACK RECORD**
   - Relevant project table: Client | Project | Value | Duration | Status
   - Performance certificates reference
   - Similar work orders completed

8. **PROJECT IMPLEMENTATION PLAN**
   - Gantt chart description with milestones
   - Deliverable schedule
   - Reporting mechanism

9. **MSME / STARTUP BENEFITS CLAIMED**
   - EMD exemption (if applicable with Udyam reference)
   - Purchase preference under PPP-MII
   - Prior experience/turnover relaxation for startups
   - Applicable government circulars referenced

## PART B: FINANCIAL PROPOSAL (ENVELOPE-2)

10. **FINANCIAL BID / BOQ (Bill of Quantities)**
    - Pricing table format: S.No | Item | Unit | Qty | Rate | Amount
    - All amounts in INR with GST breakup
    - Total in words and figures
    - Price validity statement

11. **COMMERCIAL TERMS**
    - Payment schedule and milestones
    - EMD details and bank guarantee format
    - Performance Bank Guarantee commitment
    - Insurance and indemnity provisions
    - Warranty/AMC terms offered

## PART C: ANNEXURES & DECLARATIONS

12. **STATUTORY DECLARATIONS**
    - Self-declaration of non-blacklisting / non-debarment
    - No conflict of interest declaration
    - Authenticity of information declaration
    - Declaration on judicial/arbitration proceedings
    - Acceptance of tender terms and conditions

13. **DOCUMENTS CHECKLIST**
    - Table: S.No | Document | Page No. | Status (Enclosed/To be furnished)
    - All required documents mapped

14. **POWER OF ATTORNEY / AUTHORIZATION**
    - Authorized signatory details
    - Board resolution reference

Make it PROFESSIONAL, COMPREHENSIVE, and READY FOR SUBMISSION with proper Indian government tender formatting. Use tables extensively for compliance matrices and BOQ.`
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
