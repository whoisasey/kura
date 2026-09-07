export type SessionType = "run" | "tempo" | "heavy" | "yoga" | "unilateral" | "rest" | "physio" | "resistance" | "pilates";
export type SessionStatus = "scheduled" | "completed" | "skipped" | "modified";
export type { CyclePhase } from "@/lib/cycle/phaseCalculator";

export interface PlannedSession {
  dayOfWeek: number;
  type: SessionType;
  label: string;
  sub?: string;
  distanceKm?: number;
  durationMin?: number;
  notes?: string;
}

export interface TrainingWeek {
  weekNumber: number;
  phase?: string;
  isDeload?: boolean;
  sessions: PlannedSession[];
  weeklyKm?: number;
  weekStartDate?: string; // ISO date of Monday, e.g. "2026-06-02"
}

export interface TrainingPlan {
  id?: string;
  name: string;
  description?: string;
  totalWeeks: number;
  currentWeek: number;
  weeks: TrainingWeek[];
}

export interface AISuggestion {
  suggestionText: string;
  suggestionType: "reduce_load" | "swap_session" | "add_rest" | "increase_intensity" | "general";
  reasoning: string;
}
