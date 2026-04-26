import type { SupabaseClient } from "@supabase/supabase-js"
import type { WeatherReading } from "@/types/index"

export const getLatestWeatherReading = async (
  supabase: SupabaseClient,
  userId: string
): Promise<WeatherReading | null> => {
  const { data, error } = await supabase
    .from("weather_readings")
    .select("*")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return data as WeatherReading
}

export const getLast7WeatherReadings = async (
  supabase: SupabaseClient,
  userId: string
): Promise<WeatherReading[]> => {
  const { data, error } = await supabase
    .from("weather_readings")
    .select("*")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false })
    .limit(7)

  if (error) return []
  return (data ?? []) as WeatherReading[]
}

export const insertWeatherReading = async (
  supabase: SupabaseClient,
  data: Omit<WeatherReading, "id">
): Promise<WeatherReading | null> => {
  const { data: inserted, error } = await supabase
    .from("weather_readings")
    .insert(data)
    .select()
    .single()

  if (error) return null
  return inserted as WeatherReading
}
