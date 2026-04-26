import type { CyclePhase } from '@/lib/cycle/phaseCalculator'
export type { CyclePhase }

export interface Cycle {
  id: string
  user_id: string
  period_start: string
  period_end: string | null
  cycle_length: number | null
  phase: CyclePhase | null
  notes: string | null
  created_at: string
}

export interface JournalEntry {
  id: string
  user_id: string
  entry_date: string
  mood: number | null
  energy_level: number | null
  sleep_hours: number | null
  stress_level: number | null
  hydration_level: number | null
  notes: string | null
  updated_at: string | null
}

export interface CycleInsight {
  phase: CyclePhase
  cycle_day: number
  days_until_next_phase: number
  next_phase: CyclePhase
  hormone_note: {
    headline: string
    whats_happening: string
    what_to_expect: string[]
    heads_up: string | null
  }
  exercise: {
    recommended_type: string
    intensity: 'low' | 'moderate'
    duration_minutes: number
    rationale: string
    avoid: string[]
    if_you_feel_up_to_more: string
  }
  transition_briefing: {
    arriving_in_days: number
    next_phase_name: string
    whats_shifting: string
    how_to_prepare: string[]
    what_to_look_forward_to: string
  }
}

export interface WeatherReading {
  id: string
  user_id: string
  recorded_at: string
  pressure_hpa: number | null
  pressure_delta_6h: number | null
  temperature_c: number | null
  aqi: number | null
  uv_index: number | null
  location_lat: number | null
  location_lng: number | null
  pressure_drop_forecast: boolean | null
}

export interface EnvAlerts {
  pressureDelta: number | null
  pressureDropForecast: boolean
  aqiAlert: boolean
  aqi: number | null
  uvHigh: boolean
  uvIndex: number | null
  temperatureC: number | null
  lastUpdated: string | null
}
