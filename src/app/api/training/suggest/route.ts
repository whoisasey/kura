import type { AISuggestion, CyclePhase, PlannedSession } from "@/types/training";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a wellness-aware training coach embedded in Kura, a personal health app.
The user is a 34-year-old woman, 5'3", 140lb, following an 8-week run-longer training plan with physio-prescribed unilateral work for right glute activation and hip extension.

Your role is to suggest MODIFICATIONS (not replacements) to today's planned session based on her cycle phase, how she feels today, and any symptoms she has logged.
Keep suggestions practical, specific, and grounded in exercise physiology

IMPORTANT CONSTRAINTS:
- Stay in wellness territory. Do not diagnose, prescribe, or use clinical/medical language.
- Do not suggest skipping physio-prescribed exercises without noting they are from her physio.
- Deload suggestions during menstrual phase are appropriate.
- Follicular and ovulatory phases support higher intensity work.
- Luteal phase may warrant reduced tempo targets and more recovery emphasis.
- If symptoms like cramps, fatigue, or headache are logged, factor them into load recommendations.
- If energy or sleep is low, weight that heavily — accumulated fatigue compounds injury risk.
- Always end with an encouraging, non-toxic-positivity note.

Respond in JSON only:
{
  "suggestionText": "plain language suggestion (2–4 sentences)",
  "suggestionType": "reduce_load | increase_intensity | swap_session | add_rest | general",
  "reasoning": "brief physiological rationale (1–2 sentences)"
}`;

export const POST = async (request: Request): Promise<Response> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    session: PlannedSession;
    cyclePhase?: CyclePhase;
    cycleDay?: number;
  };

  const { session, cyclePhase, cycleDay } = body;
  const today = new Date().toLocaleDateString("en-CA");

  // Fetch today's journal entry + symptoms server-side
  const { data: journal } = await supabase
    .from("journal_entries")
    .select("id, mood, energy_level, sleep_hours, stress_level, hydration_level, notes")
    .eq("user_id", user.id)
    .eq("entry_date", today)
    .maybeSingle();

  type SymptomRow = { symptom: string; severity: number | null };
  let symptoms: SymptomRow[] = [];
  if (journal?.id) {
    const { data: symptomRows } = await supabase
      .from("journal_symptoms")
      .select("symptom, severity")
      .eq("journal_entry_id", journal.id);
    symptoms = (symptomRows ?? []) as SymptomRow[];
  }

  // Build context lines — only include what was actually logged
  const lines: string[] = [
    `Today's session: ${session.label}${session.sub ? ` — ${session.sub}` : ""}${session.distanceKm ? ` (${session.distanceKm} km)` : ""}`,
    `Cycle phase: ${cyclePhase ?? "unknown"}, day ${cycleDay ?? "unknown"}`,
  ];

  const journalParts: string[] = [];
  if (journal?.mood) journalParts.push(`mood ${journal.mood}/10`);
  if (journal?.energy_level) journalParts.push(`energy ${journal.energy_level}/10`);
  if (journal?.sleep_hours) journalParts.push(`sleep ${journal.sleep_hours}h`);
  if (journal?.stress_level) journalParts.push(`stress ${journal.stress_level}/10`);
  if (journal?.hydration_level) journalParts.push(`hydration ${journal.hydration_level}/10`);
  if (journalParts.length) lines.push(`Today's check-in: ${journalParts.join(", ")}`);

  if (symptoms.length) {
    const symptomList = symptoms
      .map((s) => (s.severity ? `${s.symptom} (severity ${s.severity}/5)` : s.symptom))
      .join(", ");
    lines.push(`Logged symptoms: ${symptomList}`);
  }

  if (journal?.notes) lines.push(`Journal note: "${journal.notes}"`);

  lines.push("\nGive me a modification suggestion for today's session.");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: lines.join("\n") }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const suggestion = JSON.parse(text) as AISuggestion;

  return Response.json(suggestion);
};
