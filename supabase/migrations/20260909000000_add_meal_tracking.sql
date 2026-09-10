-- Add macro columns to meals table
ALTER TABLE meals ADD COLUMN IF NOT EXISTS calories integer;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS protein double precision;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS carbs double precision;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS fat double precision;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS weight_g double precision;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS food_library_item_id uuid;

-- Personal food library
CREATE TABLE IF NOT EXISTS food_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  category text,
  serving_description text,
  serving_weight_g double precision,
  calories_per_serving double precision,
  protein_per_serving double precision,
  carbs_per_serving double precision,
  fat_per_serving double precision,
  calories_per_100g double precision,
  protein_per_100g double precision,
  carbs_per_100g double precision,
  fat_per_100g double precision,
  is_meal_prep boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Batch meal prep calculator results
CREATE TABLE IF NOT EXISTS meal_prep_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  total_calories double precision,
  total_protein double precision,
  total_carbs double precision,
  total_fat double precision,
  total_weight_g double precision,
  servings integer,
  calories_per_serving double precision,
  protein_per_serving double precision,
  carbs_per_serving double precision,
  fat_per_serving double precision,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Per-user daily macro targets
CREATE TABLE IF NOT EXISTS daily_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calorie_target integer DEFAULT 1600,
  protein_target integer DEFAULT 120,
  carb_target integer,
  fat_target integer,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE food_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own food_library" ON food_library FOR ALL USING (auth.uid() = user_id);

ALTER TABLE meal_prep_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own meal_prep_batches" ON meal_prep_batches FOR ALL USING (auth.uid() = user_id);

ALTER TABLE daily_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own daily_targets" ON daily_targets FOR ALL USING (auth.uid() = user_id);
