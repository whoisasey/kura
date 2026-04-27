import type { CyclePhase } from '@/lib/cycle/phaseCalculator'
import type { Cycle, JournalEntry } from '@/types/index'

export const CYCLE_SYSTEM_PROMPT =
  'You are Kura, a cycle tracking app. Write like a quick note from someone who knows their stuff — short, factual, no drama. ' +
  'State what\'s happening, not what to make of it. Drop the commentary. ' +
  'PERSONALIZATION RULE: the symptom history and journal data are ground truth for this specific person. ' +
  'Every field — what_to_expect, heads_up, exercise avoid list, transition how_to_prepare, symptom_forecast — must reflect their actual pattern, not generic phase descriptions. ' +
  'If a symptom typically hits them on days 1-2 and they are on day 4, do not mention it. ' +
  'If they log high fatigue in their journal, let that shape the exercise recommendation and rationale. ' +
  'If there is no history at all, fall back to typical phase behavior briefly. ' +
  'hormone_note.headline: plain observation, no metaphor, no "that\'s X doing its thing". Just: what is happening. Max 10 words. ' +
  'hormone_note.whats_happening: 2 sentences max. Subject + verb + fact. No filler. ' +
  'exercise.rationale: 1 sentence. Just the reason, grounded in their current symptoms or journal data if available. ' +
  'transition_briefing.whats_shifting: 1 sentence. What changes, nothing more. ' +
  'symptom_forecast: only include symptoms that appeared in at least one prior cycle. days_away must be >= 0 (0 means today). ' +
  'If there is no symptom history, set symptom_forecast to null. ' +
  'Never use: journey, empower, nourish, listen to your body, honour, optimal, wellness, doing its thing, at play, kick in. ' +
  'Use wellness language only — never diagnostic or treatment language. ' +
  'Respond ONLY in valid JSON. No preamble, no markdown, no text outside the JSON.'

type SymptomEntry = { symptom: string; severity: number }
type JournalWithSymptoms = { entry_date: string; symptoms: SymptomEntry[] }

export const buildCycleUserMessage = (data: {
  today: string
  cycleDay: number
  phase: CyclePhase
  cycles: Cycle[]
  journalEntries: JournalEntry[]
  journalWithSymptoms?: JournalWithSymptoms[]
}): string => {
  const { today, cycleDay, phase, cycles, journalEntries, journalWithSymptoms = [] } = data

  const cycleHistory = cycles
    .map((c) => {
      const parts = [`period_start: ${c.period_start}`]
      if (c.period_end) parts.push(`period_end: ${c.period_end}`)
      if (c.cycle_length !== null) parts.push(`cycle_length: ${c.cycle_length} days`)
      if (c.flow_intensity) parts.push(`flow: ${c.flow_intensity}`)
      if (c.notes) parts.push(`period symptoms: ${formatCycleNotes(c.notes)}`)
      return `  - ${parts.join(', ')}`
    })
    .join('\n')

  const recentJournal = journalEntries
    .map((e) => {
      const parts = [`${e.entry_date}:`]
      if (e.mood !== null) parts.push(`mood ${e.mood}/5`)
      if (e.energy_level !== null) parts.push(`energy ${e.energy_level}/5`)
      return `  - ${parts.join(' ')}`
    })
    .join('\n')

  const symptomHistory = buildSymptomHistory(journalWithSymptoms, cycles)

  return `Today's date: ${today}
Current cycle day: ${cycleDay}
Current phase: ${phase}

Cycle history (most recent first):
${cycleHistory || '  (no history)'}

Recent journal entries (last 7 days):
${recentJournal || '  (no entries)'}

Symptom history across recent cycles:
${symptomHistory || '  (no symptom data)'}

Return the cycle insight JSON for today. The JSON must match exactly this shape:
{
  "phase": "<menstrual|follicular|ovulation|luteal>",
  "cycle_day": <number>,
  "days_until_next_phase": <number>,
  "next_phase": "<menstrual|follicular|ovulation|luteal>",
  "hormone_note": {
    "headline": "<string>",
    "whats_happening": "<string, max 3 sentences>",
    "what_to_expect": ["<string>", ...],
    "heads_up": "<string or null>"
  },
  "exercise": {
    "recommended_type": "<string>",
    "intensity": "<low|moderate>",
    "duration_minutes": <number>,
    "rationale": "<string, max 2 sentences>",
    "avoid": ["<string>", ...],
    "if_you_feel_up_to_more": "<string>"
  },
  "transition_briefing": {
    "arriving_in_days": <number>,
    "next_phase_name": "<string>",
    "whats_shifting": "<string, max 2 sentences>",
    "how_to_prepare": ["<string>", ...],
    "what_to_look_forward_to": "<string>"
  },
  "symptom_forecast": {
    "upcoming": [
      {
        "symptom": "<string>",
        "likely_day": <number>,
        "days_away": <number>,
        "confidence": "<likely|possible>"
      }
    ]
  } | null
}`
}

function formatCycleNotes(notes: string): string {
  try {
    const parsed = JSON.parse(notes) as Array<{ day: number; symptoms: string[]; flow?: string }>
    return parsed
      .sort((a, b) => a.day - b.day)
      .map((e) => {
        const label = e.day === 0 ? 'pre-period' : `day ${e.day}`
        const parts: string[] = []
        if (e.flow) parts.push(`flow: ${e.flow}`)
        if (e.symptoms.length) parts.push(e.symptoms.join(', '))
        return `${label}: ${parts.join('; ')}`
      })
      .join(' | ')
  } catch {
    return notes
  }
}

function buildSymptomHistory(
  journalWithSymptoms: JournalWithSymptoms[],
  cycles: Cycle[]
): string {
  if (!journalWithSymptoms.length || !cycles.length) return ''

  type DayEntry = { day: number; symptoms: Array<{ symptom: string; severity: number }> }
  const byCycle = new Map<string, DayEntry[]>()

  for (const entry of journalWithSymptoms) {
    if (!entry.symptoms?.length) continue
    const cycle = findCycleForDate(entry.entry_date, cycles)
    if (!cycle) continue

    const day =
      Math.floor(
        (new Date(entry.entry_date).getTime() - new Date(cycle.period_start).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1

    const key = cycle.period_start
    if (!byCycle.has(key)) byCycle.set(key, [])
    byCycle.get(key)!.push({ day, symptoms: entry.symptoms })
  }

  if (byCycle.size === 0) return ''

  return Array.from(byCycle.entries())
    .map(([start, days]) => {
      const dayLines = days
        .sort((a, b) => a.day - b.day)
        .map(
          (d) =>
            `day ${d.day}: ${d.symptoms.map((s) => `${s.symptom} (sev ${s.severity})`).join(', ')}`
        )
        .join('; ')
      return `  Cycle starting ${start}: ${dayLines}`
    })
    .join('\n')
}

function findCycleForDate(date: string, cycles: Cycle[]): Cycle | null {
  // cycles sorted descending — return first whose period_start <= date
  for (const cycle of cycles) {
    if (date >= cycle.period_start) return cycle
  }
  return null
}
