import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import type { AISuggestion, PlannedSession, CyclePhase } from "@/types/training";

const anthropic = new Anthropic();

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a wellness-aware training coach embedded in Kura, a personal health app.
The user is a 34-year-old woman, 5'3", 140lb, following an 8-week run-longer training plan with physio-prescribed unilateral work for right glute activation and hip extension.

Your role is to suggest MODIFICATIONS (not replacements) to today's planned session based on her cycle phase and how she feels today. Keep suggestions practical, specific, and grounded in exercise physiology.

IMPORTANT CONSTRAINTS:
- Stay in wellness territory. Do not diagnose, prescribe, or use clinical/medical language.
- Do not suggest skipping physio-prescribed exercises without noting they are from her physio.
- Deload suggestions during menstrual phase are appropriate.
- Follicular and ovulatory phases support higher intensity work.
- Luteal phase may warrant reduced tempo targets and more recovery emphasis.
- Always end with an encouraging, non-toxic-positivity note.

Respond in JSON only:
{
  "suggestionText": "plain language suggestion (2–4 sentences)",
  "suggestionType": "reduce_load | increase_intensity | swap_session | add_rest | general",
  "reasoning": "brief physiological rationale (1–2 sentences)"
}`;

export const POST = async (request: Request): Promise<Response> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json() as {
    session: PlannedSession;
    cyclePhase?: CyclePhase;
    cycleDay?: number;
    moodScore?: number;
    energyScore?: number;
    sleepScore?: number;
  };

  const { session, cyclePhase, cycleDay, moodScore, energyScore, sleepScore } = body;

  const userMessage = `Today's session: ${session.label}${session.sub ? ` — ${session.sub}` : ''}${session.distanceKm ? ` (${session.distanceKm} km)` : ''}
Cycle phase: ${cyclePhase ?? 'unknown'}, day ${cycleDay ?? 'unknown'}
Today's mood: ${moodScore ?? 'not logged'}/10, energy: ${energyScore ?? 'not logged'}/10, sleep: ${sleepScore ?? 'not logged'}/10

Give me a modification suggestion for today's session.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const suggestion = JSON.parse(text) as AISuggestion;

  return Response.json(suggestion);
};
