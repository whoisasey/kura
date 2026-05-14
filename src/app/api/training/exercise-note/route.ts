import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { runLongerPlan } from "@/lib/training/seedData";
import type { CyclePhase } from "@/lib/cycle/phaseCalculator";

const anthropic = new Anthropic();

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a wellness-aware training coach embedded in Kura, a personal health app.
The user is a 34-year-old woman following an 8-week run-longer training plan with physio-prescribed unilateral work for right glute activation and hip extension.

Write 2–3 sentences of specific, practical movement guidance for today's planned session based on her cycle phase and hormonal context.

Rules:
- Be specific to the session type (heavy lift, easy run, tempo run, unilateral, rest)
- Reference the relevant hormone(s) and their actual physiological effect on training
- Give one concrete, actionable cue (e.g. a pace strategy, load adjustment, or focus point)
- Stay in wellness territory — no diagnostic language
- Do not be generically encouraging; be specific and useful`;

export const GET = async (request: Request): Promise<Response> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const phase = searchParams.get("phase") as CyclePhase | null;
  const cycleDay = searchParams.get("cycleDay");
  const dow = parseInt(searchParams.get("dow") ?? "0", 10);
  const today = new Date().toLocaleDateString("en-CA");

  if (!phase) return Response.json({ error: "phase required" }, { status: 400 });

  // Cache check — one note per user per day
  const { data: cached } = await supabase
    .from("workout_ai_suggestions")
    .select("suggestion_text")
    .eq("user_id", user.id)
    .is("session_id", null)
    .eq("suggestion_type", "daily_exercise_note")
    .gte("created_at", `${today}T00:00:00`)
    .lt("created_at", `${today}T23:59:59`)
    .maybeSingle();

  if (cached) return Response.json({ note: cached.suggestion_text });

  // Cache miss — build context and call Claude
  const week = runLongerPlan.weeks.find(w => w.weekNumber === runLongerPlan.currentWeek);
  const session = week?.sessions.find(s => s.dayOfWeek === dow);

  if (!session || session.type === "rest") {
    return Response.json({ note: null });
  }

  // Fetch today's journal entry for energy/mood if it exists
  const { data: journal } = await supabase
    .from("journal_entries")
    .select("mood, energy_level, sleep_hours")
    .eq("user_id", user.id)
    .eq("entry_date", today)
    .maybeSingle();

  const moodStr = journal?.mood ? `mood ${journal.mood}/10` : null;
  const energyStr = journal?.energy_level ? `energy ${journal.energy_level}/10` : null;
  const sleepStr = journal?.sleep_hours ? `sleep ${journal.sleep_hours}h` : null;
  const journalContext = [moodStr, energyStr, sleepStr].filter(Boolean).join(", ");

  const userMessage = `Training plan: Run Longer, Week ${runLongerPlan.currentWeek} of ${runLongerPlan.totalWeeks}${week?.phase ? ` (${week.phase})` : ""}
Today's session: ${session.label}${session.sub ? ` — ${session.sub}` : ""}${session.distanceKm ? ` · ${session.distanceKm} km` : ""}
Session type: ${session.type}
Cycle phase: ${phase}, day ${cycleDay ?? "unknown"}${journalContext ? `\nToday's check-in: ${journalContext}` : ""}

Write a specific movement note for today's session.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const note = message.content[0].type === "text" ? message.content[0].text.trim() : null;
  if (!note) return Response.json({ note: null });

  // Persist to cache
  await supabase.from("workout_ai_suggestions").insert({
    user_id: user.id,
    session_id: null,
    cycle_phase: phase,
    cycle_day: cycleDay ? parseInt(cycleDay, 10) : null,
    mood_score: journal?.mood ? parseInt(journal.mood as string, 10) : null,
    energy_score: journal?.energy_level ?? null,
    suggestion_text: note,
    suggestion_type: "daily_exercise_note",
  });

  return Response.json({ note });
};
