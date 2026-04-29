import { CYCLE_SYSTEM_PROMPT, buildCycleUserMessage } from "@/lib/claude/cyclePrompt";
import type { CycleInsight, JournalEntry } from "@/types/index";
import { computeCycleDay, computePhase, daysUntilNextPhase } from "@/lib/cycle/phaseCalculator";
import { getLast6Cycles, getLatestCycle } from "@/lib/supabase/queries/cycles";
import { getLatestCachedInsight, getTodayCycleInsight } from "@/lib/supabase/queries/predictions";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

export const GET = async (request: Request): Promise<Response> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const today = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  // 1. Cache check — recompute positional fields so day/phase never drift
  const cached = await getTodayCycleInsight(supabase, user.id, today);
  if (cached) {
    const cachedCycle = await getLatestCycle(supabase, user.id);
    if (cachedCycle) {
      const freshDay = computeCycleDay(cachedCycle.period_start, today);
      const freshDaysLeft = daysUntilNextPhase(freshDay);
      return Response.json({
        ...cached,
        cycle_day: freshDay,
        phase: computePhase(freshDay),
        days_until_next_phase: freshDaysLeft,
        transition_briefing: {
          ...cached.transition_briefing,
          arriving_in_days: freshDaysLeft,
        },
      });
    }
    // Can't recompute without a cycle — fall through to fresh call
  }

  // 2. Cache miss — fetch data
  const localDateObj = new Date(today + "T00:00:00");
  const ninetyDaysAgo = new Date(today + "T00:00:00");
  ninetyDaysAgo.setDate(localDateObj.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toLocaleDateString("en-CA");
  const sevenDaysAgo = new Date(today + "T00:00:00");
  sevenDaysAgo.setDate(localDateObj.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toLocaleDateString("en-CA");

  const [latestCycle, cycles, journalRes, symptomRes] = await Promise.all([
    getLatestCycle(supabase, user.id),
    getLast6Cycles(supabase, user.id),
    supabase
      .from("journal_entries")
      .select(
        "id, user_id, entry_date, mood, energy_level, sleep_hours, stress_level, hydration_level, notes, updated_at"
      )
      .eq("user_id", user.id)
      .gte("entry_date", sevenDaysAgoStr)
      .order("entry_date", { ascending: false })
      .limit(7),
    supabase
      .from("journal_entries")
      .select("entry_date, symptoms(symptom, severity)")
      .eq("user_id", user.id)
      .gte("entry_date", ninetyDaysAgoStr)
      .order("entry_date", { ascending: false }),
  ]);

  // 3. No cycles logged yet
  if (!latestCycle) {
    return Response.json({ noData: true });
  }

  const journalEntries: JournalEntry[] = (journalRes.data ?? []) as JournalEntry[];
  const journalWithSymptoms = (symptomRes.data ?? []) as Array<{
    entry_date: string;
    symptoms: Array<{ symptom: string; severity: number }>;
  }>;
  const cycleDay = computeCycleDay(latestCycle.period_start, today);
  const phase = computePhase(cycleDay);
  const daysLeft = daysUntilNextPhase(cycleDay);
  const tomorrowCycleDay = cycleDay + 1;
  const tomorrowPhase = computePhase(tomorrowCycleDay);

  // 4. Build prompt and call Claude
  const userMessage = buildCycleUserMessage({
    today,
    cycleDay,
    phase,
    tomorrowCycleDay,
    tomorrowPhase,
    cycles,
    journalEntries,
    journalWithSymptoms,
  });

  let insight: CycleInsight;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1536,
      system: CYCLE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const text = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(text) as CycleInsight;

    // Ensure computed fields match server-side values
    insight = {
      ...parsed,
      cycle_day: cycleDay,
      phase,
      days_until_next_phase: daysLeft,
      transition_briefing: {
        ...parsed.transition_briefing,
        arriving_in_days: daysLeft,
      },
    };
  } catch (err) {
    console.error("[cycle-insight] Claude call failed:", err);

    // Fallback: return last cached insight regardless of date
    const stale = await getLatestCachedInsight(supabase, user.id);
    if (stale) return Response.json(stale);

    return Response.json({ error: "insight_failed" }, { status: 500 });
  }

  // 5. Persist to predictions table — check first to guarantee at-most-one insert per user per day
  try {
    const { data: existing } = await supabase
      .from("predictions")
      .select("id")
      .eq("user_id", user.id)
      .eq("prediction_date", today)
      .eq("call_type", "cycle_insight")
      .maybeSingle();

    if (!existing) {
      const { error: insertError } = await supabase.from("predictions").insert({
        user_id: user.id,
        prediction_date: today,
        call_type: "cycle_insight",
        phase: insight.phase,
        hormone_note: JSON.stringify(insight),
      });
      if (insertError) console.error("[cycle-insight] insert error:", insertError);
    }
  } catch (err) {
    console.error("[cycle-insight] persist failed:", err);
    // Non-fatal — still return the insight
  }

  return Response.json(insight);
};
