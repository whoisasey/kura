import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrainingPlan } from "@/types/training";

export const getActivePlan = async (
  supabase: SupabaseClient,
  userId: string
): Promise<TrainingPlan | null> => {
  const { data, error } = await supabase
    .from("training_plans")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    totalWeeks: data.total_weeks,
    currentWeek: data.current_week,
    weeks: data.plan_data.weeks ?? [],
  };
};

export const upsertPlan = async (
  supabase: SupabaseClient,
  userId: string,
  plan: TrainingPlan,
  rawSource: string,
  sourceFormat: 'json' | 'markdown'
): Promise<{ id: string } | null> => {
  // Check for existing active plan
  const { data: existing } = await supabase
    .from("training_plans")
    .select("id, current_week")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const planData = { weeks: plan.weeks };

  if (existing) {
    const { data, error } = await supabase
      .from("training_plans")
      .update({
        name: plan.name,
        description: plan.description ?? null,
        total_weeks: plan.totalWeeks,
        // Preserve current_week from DB unless explicitly set in import
        current_week: plan.currentWeek ?? existing.current_week,
        plan_data: planData,
        raw_source: rawSource,
        source_format: sourceFormat,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id")
      .single();

    if (error) return null;
    return { id: data.id };
  }

  const { data, error } = await supabase
    .from("training_plans")
    .insert({
      user_id: userId,
      name: plan.name,
      description: plan.description ?? null,
      total_weeks: plan.totalWeeks,
      current_week: plan.currentWeek,
      plan_data: planData,
      raw_source: rawSource,
      source_format: sourceFormat,
    })
    .select("id")
    .single();

  if (error) return null;
  return { id: data.id };
};
