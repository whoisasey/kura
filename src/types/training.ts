export type SessionType = 'run' | 'tempo' | 'heavy' | 'unilateral' | 'rest';
export type SessionStatus = 'scheduled' | 'completed' | 'skipped' | 'modified';
export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

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
  suggestionType: 'reduce_load' | 'swap_session' | 'add_rest' | 'increase_intensity' | 'general';
  reasoning: string;
}
