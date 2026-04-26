-- Baseline schema — reflects the state of the database as of 2026-04-26
-- This migration is for documentation purposes; tables already exist in production.

CREATE TABLE IF NOT EXISTS activities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id  uuid NOT NULL,
  activity_type     text,
  description       text,
  duration_minutes  integer,
  logged_at         timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cycles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL,
  period_start        date NOT NULL,
  period_end          date,
  cycle_length        integer,
  phase               text,
  predicted_ovulation date,
  created_at          timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ingredients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  nutrient_tags text[],
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  entry_date       date NOT NULL,
  mood             text,
  energy_level     integer,
  sleep_hours      double precision,
  sleep_quality    integer,
  stress_level     integer,
  hydration_level  integer,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meal_tags (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL,
  tag     text
);

CREATE TABLE IF NOT EXISTS meals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL,
  meal_type        text,
  description      text,
  logged_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meals_library (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  name         text NOT NULL,
  meal_type    text,
  instructions text,
  servings     integer,
  is_favourite boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS predictions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL,
  prediction_date     date NOT NULL,
  phase               text,
  hormone_note        text,
  suggested_meals     jsonb,
  suggested_activities jsonb,
  general_heads_up    text,
  call_type           text DEFAULT 'prediction',
  generated_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id       uuid NOT NULL,
  ingredient_id uuid NOT NULL,
  quantity      double precision,
  unit          text,
  notes         text
);

CREATE TABLE IF NOT EXISTS symptoms (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL,
  symptom          text,
  severity         integer
);

CREATE TABLE IF NOT EXISTS weather_readings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL DEFAULT auth.uid(),
  recorded_at           timestamptz DEFAULT now(),
  pressure_hpa          double precision,
  pressure_delta_6h     double precision,
  pressure_drop_forecast boolean DEFAULT false,
  temperature_c         double precision,
  aqi                   integer,
  uv_index              double precision,
  location_lat          double precision,
  location_lng          double precision
);
