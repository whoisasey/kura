import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { getLatestWeatherReading } from "@/lib/supabase/queries/weather"
import { buildPredictionPrompt } from "@/lib/claude/prompts"

const anthropic = new Anthropic()

interface PredictionResult {
  phase: string
  hormone_note: string
  suggested_meals: string[]
  suggested_activities: string[]
  general_heads_up: string
}

export const POST = async (): Promise<Response> => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }

  const today = new Date().toISOString().split("T")[0]

  // Fetch journal entry for today
  const { data: entry } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("entry_date", today)
    .single()

  if (!entry) {
    return Response.json({ error: "no_entry_today" }, { status: 400 })
  }

  // Fetch supporting data in parallel
  const [cycleRes, recentRes, symptomsRes, mealsRes, activitiesRes, weatherReading] =
    await Promise.all([
      supabase
        .from("cycles")
        .select("phase, period_start")
        .eq("user_id", user.id)
        .order("period_start", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("journal_entries")
        .select("entry_date, energy_level, sleep_hours, stress_level, hydration_level, notes")
        .eq("user_id", user.id)
        .lt("entry_date", today)
        .order("entry_date", { ascending: false })
        .limit(7),
      supabase.from("symptoms").select("symptom").eq("journal_entry_id", entry.id),
      supabase.from("meals").select("description").eq("journal_entry_id", entry.id),
      supabase.from("activities").select("description").eq("journal_entry_id", entry.id),
      getLatestWeatherReading(supabase, user.id),
    ])

  const cycle = cycleRes.data ?? null
  const recentEntries = recentRes.data ?? []
  const symptoms = (symptomsRes.data ?? []).map((s: { symptom: string }) => s.symptom)
  const meals = (mealsRes.data ?? []).map((m: { description: string }) => m.description)
  const activities = (activitiesRes.data ?? []).map((a: { description: string }) => a.description)

  // Build prompt and call Claude
  const prompt = buildPredictionPrompt({
    entry,
    cycle,
    recentEntries,
    symptoms,
    meals,
    activities,
    weather: weatherReading,
  })

  let parsed: PredictionResult

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    parsed = JSON.parse(text) as PredictionResult
  } catch (err) {
    console.error("[predict] Claude call failed:", err)
    return Response.json({ error: "prediction_failed" }, { status: 500 })
  }

  // Upsert prediction row with alert flags
  const { data: prediction, error: upsertError } = await supabase
    .from("predictions")
    .upsert(
      {
        user_id: user.id,
        prediction_date: today,
        phase: parsed.phase,
        hormone_note: parsed.hormone_note,
        suggested_meals: parsed.suggested_meals,
        suggested_activities: parsed.suggested_activities,
        general_heads_up: parsed.general_heads_up,
      },
      { onConflict: "user_id,prediction_date" }
    )
    .select()
    .single()

  if (upsertError) {
    console.error("[predict] upsert failed:", upsertError)
    return Response.json({ error: "save_failed" }, { status: 500 })
  }

  return Response.json(prediction)
}
