-- Training plan storage (importable via JSON or Markdown)
create table training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  total_weeks int not null,
  current_week int not null default 1,
  plan_data jsonb not null,
  raw_source text,
  source_format text check (source_format in ('json', 'markdown')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Individual workout sessions
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  plan_id uuid references training_plans(id),
  week_number int not null,
  day_of_week int not null,
  session_type text not null,
  scheduled_date date,
  completed_at timestamptz,
  status text check (status in ('scheduled', 'completed', 'skipped', 'modified')) default 'scheduled',
  planned_distance_km numeric(5,2),
  planned_duration_min int,
  planned_notes text,
  actual_distance_km numeric(5,2),
  actual_duration_min int,
  actual_rpe int check (actual_rpe between 1 and 10),
  completion_notes text,
  ai_suggestion text,
  ai_suggestion_applied boolean default false,
  created_at timestamptz default now()
);

-- AI workout modification log
create table workout_ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  session_id uuid references workout_sessions(id),
  journal_entry_id uuid,
  cycle_phase text,
  cycle_day int,
  mood_score int,
  energy_score int,
  suggestion_text text not null,
  suggestion_type text,
  was_applied boolean default false,
  created_at timestamptz default now()
);

alter table training_plans enable row level security;
alter table workout_sessions enable row level security;
alter table workout_ai_suggestions enable row level security;

create policy "Users own their training data" on training_plans for all using (auth.uid() = user_id);
create policy "Users own their sessions" on workout_sessions for all using (auth.uid() = user_id);
create policy "Users own their suggestions" on workout_ai_suggestions for all using (auth.uid() = user_id);
