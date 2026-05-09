import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrganizationContext";

export type Feature =
  | "ai_analyze"
  | "ai_generate_proposal"
  | "export_pdf"
  | "export_docx"
  | "invite_members"
  | "delete_tender";

const PLAN_FEATURES: Record<string, Set<Feature>> = {
  trial: new Set(["ai_analyze", "ai_generate_proposal", "export_pdf"]),
  starter: new Set(["ai_analyze", "ai_generate_proposal", "export_pdf", "export_docx", "invite_members"]),
  professional: new Set([
    "ai_analyze", "ai_generate_proposal", "export_pdf", "export_docx", "invite_members", "delete_tender",
  ]),
  enterprise: new Set([
    "ai_analyze", "ai_generate_proposal", "export_pdf", "export_docx", "invite_members", "delete_tender",
  ]),
};

export const PLAN_MEMBER_LIMIT: Record<string, number> = {
  trial: 1,
  starter: 3,
  professional: 10,
  enterprise: 999,
};

export function useEntitlement(feature: Feature) {
  const { currentOrg } = useOrg();
  const plan = currentOrg?.plan || "trial";
  const trialExpired =
    plan === "trial" && currentOrg?.trial_ends_at
      ? new Date(currentOrg.trial_ends_at).getTime() < Date.now()
      : false;
  const allowed = !trialExpired && PLAN_FEATURES[plan]?.has(feature);
  return { allowed, plan, trialExpired };
}

export interface AiQuota {
  allowed: boolean;
  reason: string;
  plan: string;
  limit: number;
  used: number;
  remaining: number;
}

export function useAiQuota() {
  const { currentOrg } = useOrg();
  const [quota, setQuota] = useState<AiQuota | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!currentOrg) {
      setQuota(null);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("org_ai_quota_remaining", { _org_id: currentOrg.id });
    if (!error && data) setQuota(data as unknown as AiQuota);
    setLoading(false);
  }, [currentOrg]);

  useEffect(() => { refresh(); }, [refresh]);

  return { quota, loading, refresh };
}
