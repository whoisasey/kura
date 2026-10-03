import type { Cycle } from "@/types/index";
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeAvgCycleInterval } from "@/lib/cycle/phaseCalculator";

export const getLatestCycle = async (supabase: SupabaseClient, userId: string): Promise<Cycle | null> => {
  const { data } = await supabase
    .from("cycles")
    .select("*")
    .eq("user_id", userId)
    .order("period_start", { ascending: false })
    .limit(1)
    .single();
  return data ?? null;
};

export const getLast6Cycles = async (supabase: SupabaseClient, userId: string): Promise<Cycle[]> => {
  const { data } = await supabase
    .from("cycles")
    .select("*")
    .eq("user_id", userId)
    .order("period_start", { ascending: false })
    .limit(6);
  return data ?? [];
};

// Derived from period_start gaps across the last 6 cycles — the same method
// the cycle feature's own AI insight uses (computeAvgCycleInterval). The
// `cycle_length` column is NOT full cycle length; updateCycleEnd below sets
// it to period duration (period_start → period_end), so it must not be used
// for this calculation.
export const getAvgCycleLength = async (supabase: SupabaseClient, userId: string): Promise<number> => {
  const { data } = await supabase
    .from("cycles")
    .select("period_start")
    .eq("user_id", userId)
    .order("period_start", { ascending: false })
    .limit(6);

  if (!data || data.length === 0) return 28;

  return computeAvgCycleInterval(data.map((r: { period_start: string }) => r.period_start));
};

export const insertCycle = async (
  supabase: SupabaseClient,
  data: {
    user_id: string;
    period_start: string;
    period_end?: string;
    phase?: string;
    flow_intensity?: string;
    notes?: string;
  }
): Promise<Cycle> => {
  const { data: row, error } = await supabase.from("cycles").insert(data).select().single();
  if (error) throw new Error(error.message);
  return row as Cycle;
};

export const updateCycleEnd = async (supabase: SupabaseClient, cycleId: string, periodEnd: string): Promise<void> => {
  // Also compute cycle_length from period_start
  const { data: existing } = await supabase.from("cycles").select("period_start").eq("id", cycleId).single();

  const cycleLength = existing
    ? Math.round((new Date(periodEnd).getTime() - new Date(existing.period_start).getTime()) / (1000 * 60 * 60 * 24)) +
      1
    : null;

  await supabase
    .from("cycles")
    .update({ period_end: periodEnd, ...(cycleLength !== null ? { cycle_length: cycleLength } : {}) })
    .eq("id", cycleId);
};
