import { createClient } from "@/lib/supabase/client";

export const getRecentEntries = async (userId: string, days = 30) => {
  const supabase = createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("entry_date", sinceStr)
    .order("entry_date", { ascending: false });

  return data ?? [];
};

export const getRecentSymptoms = async (userId: string, days = 30) => {
  const supabase = createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  const { data } = await supabase
    .from("symptoms")
    .select("symptom, journal_entries!inner(user_id, entry_date)")
    .eq("journal_entries.user_id", userId)
    .gte("journal_entries.entry_date", sinceStr);

  return data ?? [];
};
