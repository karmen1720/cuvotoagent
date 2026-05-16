import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type ProposalPayload = {
  proposalId: string;
  tenderId: string;
  tenderTitle: string;
  requirements: Record<string, unknown>;
  eligibility: Record<string, unknown> | null;
  companyProfile: Record<string, unknown> | null;
  orgId: string;
  userId: string;
};

function jobState(status: "processing" | "failed", extra: Record<string, unknown> = {}) {
  return {
    _job: {
      type: "proposal",
      status,
      ...extra,
    },
  };
}

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

async function runProposalGeneration(admin: ReturnType<typeof createClient>, payload: ProposalPayload) {
  const { proposalId, tenderId, tenderTitle, requirements, eligibility, companyProfile, orgId, userId } = payload;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  try {
    const companyDetails = buildCompanyContext(companyProfile);
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const response = await fetchWithFallback({
      model: "google/gemini-2.5-flash",
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

===DOCUMENT: Bid Security Declaration===
Bid Security Declaration in lieu of EMD as per GFR 2022 Rule 170 & DoE OM F.9/4/2020-PPD dated 12.11.2020. Include:
- Reference to tender ID and date
- Declaration that if bidder withdraws/modifies bid during validity, or fails to sign contract / furnish PBG if awarded, the bidder will be SUSPENDED from being eligible for bid submission in any contract with the buyer for a period of 1 (one) year from the date of notification
- Acceptance of disqualification consequences
- Authorized signatory with company seal

===DOCUMENT: Board Resolution===
Certified true copy of Board Resolution / Power of Attorney authorising the signatory to sign and submit the bid. Include:
- Company name, CIN, registered office
- Resolution number and date of board meeting
- Names of board members present
- Resolution text authorising [Authorized Signatory Name], [Designation] to sign, submit, negotiate and execute all bid documents, contracts, and related papers for the tender
- Specimen signature block of authorised person
- Certified by Company Secretary / Director with seal

===DOCUMENT: Power of Attorney===
Power of Attorney for Authorised Signatory on Rs.100 non-judicial stamp paper format. Include:
- Executed by [Company Name] through its Board of Directors
- In favour of [Authorized Signatory Name], [Designation], [PAN]
- Powers granted: sign bid, submit documents, attend pre-bid meetings, negotiate, sign contract, receive payments, represent before authorities
- Validity period
- Notarisation block

===DOCUMENT: Integrity Pact===
Integrity Pact as per CVC guidelines (Office Order No. 41/12/07 dated 04.12.2007) between the bidder and the Principal (procuring entity). Include:
- Section 1: Commitments of the Principal (no demand for bribes, equal treatment)
- Section 2: Commitments of the Bidder (no bribes, no collusion, disclose payments to agents, no misuse of confidential info)
- Section 3: Disqualification from tender process and exclusion from future contracts
- Section 4: Compensation for damages
- Section 5: Previous transgressions disclosure
- Section 6: Equal treatment of all bidders / sub-contractors
- Section 7: Criminal charges against violating bidders
- Section 8: Independent External Monitor
- Section 9: Pact duration
- Signature blocks for Principal and Bidder

===DOCUMENT: EMD Undertaking===
EMD / Tender Fee Exemption Undertaking for MSME / Startup / NSIC registered entities. Include:
- Reference to MSME Udyam / NSIC / DPIIT Startup registration number with date and validity
- Reference to relevant exemption notifications (MSME Procurement Policy 2012, DIPP Notification G.S.R. 501(E))
- Declaration claiming exemption from EMD and Tender Document Fee
- Undertaking to refund any benefit availed if registration is found invalid
- Authorised signatory with seal

===DOCUMENT: Documents Checklist===
Complete checklist table: S.No | Document | Page No. | Status (Enclosed/To be furnished). Include all 18 documents generated above.

Make each document PROFESSIONAL, COMPLETE, and READY FOR SUBMISSION with proper Indian government formatting per GFR 2017/2022, CVC, and DoE guidelines. Use the exact company details provided.`
        }
      ],
      reasoning: { effort: "low" }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
      if (response.status === 402) throw new Error("AI credits exhausted. Please add funds in Settings > Workspace > Usage.");
      throw new Error("Proposal generation failed");
    }

    const result = await response.json();
    const proposalText = result.choices?.[0]?.message?.content || "Failed to generate proposal";
    const tokensUsed = result.usage?.total_tokens || 0;

    const { error: updateError } = await admin
      .from("proposals")
      .update({
        content: proposalText,
        metadata: {
          generatedAt: new Date().toISOString(),
          source: "lovable-ai",
          tenderId,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId)
      .eq("organization_id", orgId);
    if (updateError) throw updateError;

    const { error: usageError } = await admin.from("usage_events").insert({
      organization_id: orgId,
      user_id: userId,
      event_type: "generate_proposal",
      tokens_used: tokensUsed,
      tender_id: tenderId,
    });
    if (usageError) console.error("usage log failed", usageError);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown proposal error";
    console.error("generate-proposal background error:", error);
    await admin
      .from("proposals")
      .update({
        content: null,
        metadata: jobState("failed", { failedAt: new Date().toISOString(), error: message, tenderId }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId)
      .eq("organization_id", orgId);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsErr } = await sb.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;
    const emailVerified = (claimsData.claims as any).email_verified !== false;

    const { proposalId, tenderId, tenderTitle, requirements, eligibility, companyProfile, orgId } = await req.json();

    if (!tenderTitle) {
      return new Response(JSON.stringify({ error: 'tenderTitle is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!proposalId) {
      return new Response(JSON.stringify({ error: 'proposalId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!tenderId) {
      return new Response(JSON.stringify({ error: 'tenderId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!orgId) {
      return new Response(JSON.stringify({ error: 'orgId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

    const { data: proposal } = await admin
      .from("proposals")
      .select("id")
      .eq("id", proposalId)
      .eq("organization_id", orgId)
      .eq("tender_id", tenderId)
      .maybeSingle();
    if (!proposal) {
      return new Response(JSON.stringify({ error: "Proposal record not found." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: quotaData } = await admin.rpc("org_ai_quota_remaining", { _org_id: orgId });
    const quota = quotaData as any;
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
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
    const { error: queueError } = await admin
      .from("proposals")
      .update({
        content: null,
        metadata: jobState("processing", { startedAt, tenderId }),
        updated_at: startedAt,
      })
      .eq("id", proposalId)
      .eq("organization_id", orgId);
    if (queueError) throw queueError;

    EdgeRuntime.waitUntil(runProposalGeneration(admin, {
      proposalId,
      tenderId,
      tenderTitle,
      requirements,
      eligibility,
      companyProfile,
      orgId,
      userId,
    }));

    return new Response(JSON.stringify({ accepted: true, proposalId, status: "processing" }), {
      status: 202,
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
