import { createClient } from "@/lib/supabase/client";

export interface MealWithMacros {
  id: string;
  journal_entry_id: string;
  meal_type: string;
  description: string;
  logged_at: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  weight_g: number | null;
  food_library_item_id: string | null;
}

export interface FoodLibraryItem {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  category: string | null;
  serving_description: string | null;
  serving_weight_g: number | null;
  calories_per_serving: number | null;
  protein_per_serving: number | null;
  carbs_per_serving: number | null;
  fat_per_serving: number | null;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  is_meal_prep: boolean;
  created_at: string;
}

export interface MealPrepBatch {
  id: string;
  user_id: string;
  name: string;
  total_calories: number | null;
  total_protein: number | null;
  total_carbs: number | null;
  total_fat: number | null;
  total_weight_g: number | null;
  servings: number | null;
  calories_per_serving: number | null;
  protein_per_serving: number | null;
  carbs_per_serving: number | null;
  fat_per_serving: number | null;
  notes: string | null;
  created_at: string;
}

export interface DailyTargets {
  id: string;
  user_id: string;
  calorie_target: number;
  protein_target: number;
  carb_target: number | null;
  fat_target: number | null;
  updated_at: string;
}

export interface AddMealData {
  meal_type: string;
  description: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  weight_g?: number | null;
  food_library_item_id?: string | null;
}

export interface AddFoodLibraryItemData {
  name: string;
  brand?: string | null;
  category?: string | null;
  serving_description?: string | null;
  serving_weight_g?: number | null;
  calories_per_serving?: number | null;
  protein_per_serving?: number | null;
  carbs_per_serving?: number | null;
  fat_per_serving?: number | null;
  calories_per_100g?: number | null;
  protein_per_100g?: number | null;
  carbs_per_100g?: number | null;
  fat_per_100g?: number | null;
  is_meal_prep?: boolean;
}

export interface SaveMealPrepBatchData {
  name: string;
  total_calories?: number | null;
  total_protein?: number | null;
  total_carbs?: number | null;
  total_fat?: number | null;
  total_weight_g?: number | null;
  servings?: number | null;
  calories_per_serving?: number | null;
  protein_per_serving?: number | null;
  carbs_per_serving?: number | null;
  fat_per_serving?: number | null;
  notes?: string | null;
}

export const getMealsWithMacrosForDate = async (
  userId: string,
  date: string
): Promise<MealWithMacros[]> => {
  const supabase = createClient();

  try {
    const { data: entry } = await supabase
      .from("journal_entries")
      .select("id")
      .eq("user_id", userId)
      .eq("entry_date", date)
      .single();

    if (!entry) return [];

    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("journal_entry_id", entry.id)
      .order("logged_at", { ascending: true });

    if (error) return [];
    return (data ?? []) as MealWithMacros[];
  } catch {
    return [];
  }
};

export const addMealWithMacros = async (
  entryId: string,
  data: AddMealData
): Promise<MealWithMacros | null> => {
  const supabase = createClient();

  const { data: row, error } = await supabase
    .from("meals")
    .insert({ journal_entry_id: entryId, ...data })
    .select()
    .single();

  if (error) return null;
  return row as MealWithMacros;
};

export const updateMeal = async (
  id: string,
  data: Partial<AddMealData>
): Promise<MealWithMacros | null> => {
  const supabase = createClient();

  const { data: row, error } = await supabase
    .from("meals")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) return null;
  return row as MealWithMacros;
};

export const deleteMeal = async (id: string): Promise<void> => {
  const supabase = createClient();
  await supabase.from("meals").delete().eq("id", id);
};

export const getFoodLibrary = async (userId: string): Promise<FoodLibraryItem[]> => {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("food_library")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (error) return [];
    return (data ?? []) as FoodLibraryItem[];
  } catch {
    return [];
  }
};

export const addFoodLibraryItem = async (
  userId: string,
  data: AddFoodLibraryItemData
): Promise<FoodLibraryItem | null> => {
  const supabase = createClient();

  const { data: row, error } = await supabase
    .from("food_library")
    .insert({ user_id: userId, ...data })
    .select()
    .single();

  if (error) return null;
  return row as FoodLibraryItem;
};

export const deleteFoodLibraryItem = async (id: string): Promise<void> => {
  const supabase = createClient();
  await supabase.from("food_library").delete().eq("id", id);
};

export const getMealPrepBatches = async (userId: string): Promise<MealPrepBatch[]> => {
  const supabase = createClient();

  const { data } = await supabase
    .from("meal_prep_batches")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []) as MealPrepBatch[];
};

export const saveMealPrepBatch = async (
  userId: string,
  data: SaveMealPrepBatchData
): Promise<MealPrepBatch | null> => {
  const supabase = createClient();

  const { data: row, error } = await supabase
    .from("meal_prep_batches")
    .insert({ user_id: userId, ...data })
    .select()
    .single();

  if (error) return null;
  return row as MealPrepBatch;
};

export const getDailyTargets = async (userId: string): Promise<DailyTargets> => {
  const supabase = createClient();

  const defaults: DailyTargets = {
    id: "",
    user_id: userId,
    calorie_target: 1600,
    protein_target: 120,
    carb_target: null,
    fat_target: null,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("daily_targets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) return defaults;
    return data as DailyTargets;
  } catch {
    return defaults;
  }
};

export const upsertDailyTargets = async (
  userId: string,
  data: { calorie_target: number; protein_target: number; carb_target?: number | null; fat_target?: number | null }
): Promise<DailyTargets | null> => {
  const supabase = createClient();

  const { data: row, error } = await supabase
    .from("daily_targets")
    .upsert(
      { user_id: userId, ...data, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) return null;
  return row as DailyTargets;
};
