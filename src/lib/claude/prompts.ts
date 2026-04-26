import type { WeatherReading } from "@/types/index"

interface JournalEntry {
  entry_date: string
  energy_level: number | null
  sleep_hours: number | null
  stress_level: number | null
  hydration_level: number | null
  notes: string | null
}

interface CycleInfo {
  phase: string | null
  period_start: string | null
}

interface PromptData {
  entry: JournalEntry
  cycle: CycleInfo | null
  recentEntries: JournalEntry[]
  symptoms: string[]
  meals: string[]
  activities: string[]
  weather: WeatherReading | null
}

export const buildPredictionPrompt = (data: PromptData): string => {
  const { entry, cycle, recentEntries, symptoms, meals, activities, weather } = data

  const lines: string[] = []

  lines.push("You are a supportive wellness companion for a menstrual health app.")
  lines.push(
    "Based on the user's journal data below, provide personalised wellness guidance for today."
  )
  lines.push("")
  lines.push("--- Today's journal ---")
  lines.push(`Date: ${entry.entry_date}`)
  if (entry.energy_level !== null) lines.push(`Energy: ${entry.energy_level}/5`)
  if (entry.sleep_hours !== null) lines.push(`Sleep: ${entry.sleep_hours}h`)
  if (entry.stress_level !== null) lines.push(`Stress: ${entry.stress_level}/5`)
  if (entry.hydration_level !== null) lines.push(`Hydration: ${entry.hydration_level}/5`)
  if (symptoms.length > 0) lines.push(`Symptoms: ${symptoms.join(", ")}`)
  if (meals.length > 0) lines.push(`Meals today: ${meals.join(", ")}`)
  if (activities.length > 0) lines.push(`Activities: ${activities.join(", ")}`)
  if (entry.notes) lines.push(`Notes: ${entry.notes}`)

  if (cycle) {
    lines.push("")
    lines.push("--- Cycle info ---")
    if (cycle.phase) lines.push(`Current phase: ${cycle.phase}`)
    if (cycle.period_start) lines.push(`Period start: ${cycle.period_start}`)
  }

  if (recentEntries.length > 0) {
    lines.push("")
    lines.push("--- Recent entries (last 7 days) ---")
    recentEntries.forEach((e) => {
      const parts = [`${e.entry_date}:`]
      if (e.energy_level !== null) parts.push(`energy ${e.energy_level}/5`)
      if (e.sleep_hours !== null) parts.push(`sleep ${e.sleep_hours}h`)
      if (e.stress_level !== null) parts.push(`stress ${e.stress_level}/5`)
      lines.push(parts.join(" "))
    })
  }

  // Environmental block — injected in Step 7
  const envBlock = buildEnvBlock(weather)
  if (envBlock) {
    lines.push("")
    lines.push(envBlock)
  }

  lines.push("")
  lines.push(
    "Respond ONLY with a JSON object (no markdown, no code fences) with these exact keys:"
  )
  lines.push(
    '{ "phase": string, "hormone_note": string, "suggested_meals": string[], "suggested_activities": string[], "general_heads_up": string }'
  )
  lines.push(
    "Use warm, wellness-focused language. Do not use diagnostic or medical language. Keep each field concise."
  )

  return lines.join("\n")
}

export const buildEnvBlock = (weather: WeatherReading | null): string => {
  if (
    weather === null ||
    (weather.pressure_hpa === null &&
      weather.aqi === null &&
      weather.uv_index === null &&
      weather.temperature_c === null)
  ) {
    return ""
  }

  const lines: string[] = []
  lines.push("--- Environmental context (today) ---")

  if (weather.pressure_hpa !== null) {
    const delta = weather.pressure_delta_6h
    const deltaStr = delta !== null ? ` (change last 6h: ${delta.toFixed(1)} hPa)` : ""
    lines.push(`Barometric pressure: ${weather.pressure_hpa} hPa${deltaStr}`)
    if (delta !== null && delta <= -3) {
      lines.push("Significant pressure drop — headache risk is elevated.")
    }
  }

  if (weather.aqi !== null) {
    const aqiNote = weather.aqi > 50 ? "— elevated, limit vigorous outdoor activity." : "— acceptable."
    lines.push(`Air quality index: ${weather.aqi} ${aqiNote}`)
  }

  if (weather.uv_index !== null) {
    const uvNote = weather.uv_index >= 6 ? "— high, sun protection recommended." : ""
    lines.push(`UV index: ${weather.uv_index}${uvNote ? ` ${uvNote}` : ""}`)
  }

  if (weather.temperature_c !== null) {
    lines.push(`Temperature: ${weather.temperature_c}°C`)
  }

  lines.push("")
  lines.push(
    "Factor these signals into your recommendations using wellness language only. Do not repeat raw numbers. Synthesise into natural guidance."
  )

  return lines.join("\n")
}
