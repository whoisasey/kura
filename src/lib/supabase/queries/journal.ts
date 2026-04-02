import { createClient } from "@/lib/supabase/client";

export const getOrCreateTodayEntry = async (userId: string) => {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("entry_date", today)
    .single();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("journal_entries")
    .insert({ user_id: userId, entry_date: today })
    .select()
    .single();

  if (error) return null;
  return created;
};

export const updateJournalEntry = async (id: string, fields: Record<string, unknown>) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return null;
  return data;
};

export const getMealsForEntry = async (entryId: string) => {
  const supabase = createClient();
  const { data } = await supabase
    .from("meals")
    .select("*")
    .eq("journal_entry_id", entryId)
    .order("logged_at", { ascending: true });
  return data ?? [];
};

export const addMeal = async (entryId: string, meal_type: string, description: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meals")
    .insert({ journal_entry_id: entryId, meal_type, description })
    .select()
    .single();
  if (error) return null;
  return data;
};

export const deleteMeal = async (id: string) => {
  const supabase = createClient();
  await supabase.from("meals").delete().eq("id", id);
};

export const getActivitiesForEntry = async (entryId: string) => {
  const supabase = createClient();
  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("journal_entry_id", entryId)
    .order("logged_at", { ascending: true });
  return data ?? [];
};

export const addActivity = async (
  entryId: string,
  activity_type: string,
  description: string,
  duration_minutes?: number
) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activities")
    .insert({ journal_entry_id: entryId, activity_type, description, duration_minutes })
    .select()
    .single();
  if (error) return null;
  return data;
};

export const deleteActivity = async (id: string) => {
  const supabase = createClient();
  await supabase.from("activities").delete().eq("id", id);
};

export const getSymptomsForEntry = async (entryId: string) => {
  const supabase = createClient();
  const { data } = await supabase.from("symptoms").select("*").eq("journal_entry_id", entryId);
  return data ?? [];
};

export const toggleSymptom = async (entryId: string, symptom: string, severity: number, existing?: string) => {
  const supabase = createClient();

  if (existing) {
    await supabase.from("symptoms").delete().eq("id", existing);
    return null;
  }

  const { data } = await supabase
    .from("symptoms")
    .insert({ journal_entry_id: entryId, symptom, severity })
    .select()
    .single();
  return data;
};
