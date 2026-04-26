import { createClient } from "@/lib/supabase/server"
import { fetchWeather } from "@/lib/weather/openmeteo"
import { getLast7WeatherReadings, insertWeatherReading } from "@/lib/supabase/queries/weather"
import type { WeatherReading } from "@/types/index"

export const POST = async (request: Request): Promise<Response> => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }

  let lat: number
  let lng: number

  try {
    const body = (await request.json()) as { lat?: unknown; lng?: unknown }
    if (typeof body.lat !== "number" || typeof body.lng !== "number") {
      return Response.json({ skipped: true })
    }
    lat = body.lat
    lng = body.lng
  } catch {
    return Response.json({ skipped: true })
  }

  let weatherData: Omit<WeatherReading, "id">

  try {
    const fetched = await fetchWeather(lat, lng)

    // Find reading closest to 6h ago to compute pressure delta
    const history = await getLast7WeatherReadings(supabase, user.id)
    const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000

    let pressure_delta_6h: number | null = null

    if (history.length > 0 && fetched.pressure_hpa !== null) {
      const closest = history.reduce<WeatherReading | null>((best, reading) => {
        const readingTime = new Date(reading.recorded_at).getTime()
        const bestTime = best ? new Date(best.recorded_at).getTime() : null
        const diffCurrent = Math.abs(readingTime - sixHoursAgo)
        const diffBest = bestTime !== null ? Math.abs(bestTime - sixHoursAgo) : Infinity
        return diffCurrent < diffBest ? reading : best
      }, null)

      if (closest?.pressure_hpa !== null && closest?.pressure_hpa !== undefined) {
        pressure_delta_6h = fetched.pressure_hpa - closest.pressure_hpa
      }
    }

    weatherData = {
      user_id: user.id,
      recorded_at: new Date().toISOString(),
      ...fetched,
      pressure_delta_6h,
    }
  } catch (err) {
    console.error("[weather] Open-Meteo fetch failed:", err)
    return Response.json({ error: "weather_unavailable" })
  }

  const inserted = await insertWeatherReading(supabase, weatherData)

  if (!inserted) {
    return Response.json({ error: "weather_unavailable" })
  }

  return Response.json(inserted)
}
