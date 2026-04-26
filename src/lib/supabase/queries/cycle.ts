import { createClient } from "@/lib/supabase/client";

export const getCycles = async (userId: string) => {
  const supabase = createClient();
  const { data } = await supabase
    .from("cycles")
    .select("*")
    .eq("user_id", userId)
    .order("period_start", { ascending: false });
  return data ?? [];
};

export const logCycle = async (userId: string, period_start: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cycles")
    .insert({ user_id: userId, period_start })
    .select()
    .single();
  if (error) return null;
  return data;
};

export const deleteCycle = async (id: string) => {
  const supabase = createClient();
  await supabase.from("cycles").delete().eq("id", id);
};
