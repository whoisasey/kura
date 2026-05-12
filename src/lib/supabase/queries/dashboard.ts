import { createClient } from "@/lib/supabase/client";

export const getTodayPrediction = async (userId: string) => {
  const supabase = createClient();
  const today = new Date().toLocaleDateString("en-CA");

  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", userId)
    .eq("prediction_date", today)
    .maybeSingle();

  if (error) return null;
  return data;
};

export const getLatestCycle = async (userId: string) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("cycles")
    .select("*")
    .eq("user_id", userId)
    .order("period_start", { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
};

export const getTodayEntry = async (userId: string) => {
  const supabase = createClient();
  const today = new Date().toLocaleDateString("en-CA");

  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("entry_date", today)
    .single();

  if (error) return null;
  return data;
};
