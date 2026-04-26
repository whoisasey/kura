import type { CyclePhase } from '@/lib/cycle/phaseCalculator'
import type { Cycle, JournalEntry } from '@/types/index'

export const CYCLE_SYSTEM_PROMPT =
  'You are Kura, a cycle tracking app with the voice of a sharp, observant friend who happens to know a lot about hormones. ' +
  'You text, not lecture. Short sentences. No fluff, no filler, no "as you may know". ' +
  'Be specific to today\'s cycle day — not generic phase copy that could apply to anyone. ' +
  'hormone_note.headline: one punchy line, like something you\'d notice and mention offhand. ' +
  'hormone_note.whats_happening: 2 sentences max, casual and direct. ' +
  'exercise.rationale: 1-2 sentences, just the real reason. ' +
  'transition_briefing.whats_shifting: 1-2 sentences, what\'s actually about to change. ' +
  'Never use words like: journey, empower, nourish, listen to your body, honour, optimal, wellness. ' +
  'Use wellness language only — never diagnostic or treatment language. ' +
  'Respond ONLY in valid JSON. No preamble, no markdown, no text outside the JSON.'

export const buildCycleUserMessage = (data: {
  today: string
  cycleDay: number
  phase: CyclePhase
  cycles: Cycle[]
  journalEntries: JournalEntry[]
}): string => {
  const { today, cycleDay, phase, cycles, journalEntries } = data

  const cycleHistory = cycles
    .map((c) => {
      const parts = [`period_start: ${c.period_start}`]
      if (c.period_end) parts.push(`period_end: ${c.period_end}`)
      if (c.cycle_length !== null) parts.push(`cycle_length: ${c.cycle_length} days`)
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

  return `Today's date: ${today}
Current cycle day: ${cycleDay}
Current phase: ${phase}

Cycle history (most recent first):
${cycleHistory || '  (no history)'}

Recent journal entries (last 7 days):
${recentJournal || '  (no entries)'}

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
  }
}`
}
