import { supabase } from "@/integrations/supabase/client";

export type TenderStage = "new" | "screening" | "bid_prep" | "submitted" | "won" | "lost" | "dropped";
export type TenderPriority = "low" | "medium" | "high" | "urgent";

export interface Tender {
  id: string;
  organization_id: string;
  created_by: string;
  assignee_id: string | null;
  title: string;
  reference_no: string | null;
  buyer: string | null;
  department: string | null;
  category: string | null;
  source_url: string | null;
  estimated_value: number | null;
  emd_amount: number | null;
  publish_date: string | null;
  submission_deadline: string | null;
  opening_date: string | null;
  stage: TenderStage;
  priority: TenderPriority;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export const STAGES: { id: TenderStage; label: string }[] = [
  { id: "new", label: "New" },
  { id: "screening", label: "Screening" },
  { id: "bid_prep", label: "Bid Prep" },
  { id: "submitted", label: "Submitted" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
  { id: "dropped", label: "Dropped" },
];

export const PRIORITIES: TenderPriority[] = ["low", "medium", "high", "urgent"];

export async function listTenders(orgId: string): Promise<Tender[]> {
  const { data, error } = await supabase
    .from("tenders")
    .select("*")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Tender[];
}

export async function getTender(id: string): Promise<Tender> {
  const { data, error } = await supabase.from("tenders").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Tender;
}

export async function createTender(payload: Partial<Tender> & { organization_id: string; created_by: string; title: string }) {
  const { data, error } = await supabase.from("tenders").insert(payload).select().single();
  if (error) throw error;
  return data as Tender;
}

export async function updateTender(id: string, patch: Partial<Tender>) {
  const { data, error } = await supabase.from("tenders").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Tender;
}

export async function deleteTender(id: string) {
  const { error } = await supabase.from("tenders").delete().eq("id", id);
  if (error) throw error;
}
