import type { WeatherReading } from "@/types/index"

interface ForecastResponse {
  hourly: {
    time: string[]
    pressure_msl: number[]
    temperature_2m: number[]
    uv_index: number[]
  }
}

interface AirQualityResponse {
  current: {
    european_aqi: number
  }
}

type PartialWeatherReading = Omit<WeatherReading, "id" | "user_id" | "recorded_at">

const computePressureDropForecast = (pressures: number[], currentHour: number): boolean => {
  const currentPressure = pressures[currentHour]
  if (currentPressure === undefined) return false
  // Check if pressure will drop >= 3 hPa at any point from now to end of day
  return pressures.slice(currentHour + 1).some((p) => currentPressure - p >= 3.0)
}

export const fetchWeather = async (lat: number, lng: number): Promise<PartialWeatherReading> => {
  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast")
  forecastUrl.searchParams.set("latitude", String(lat))
  forecastUrl.searchParams.set("longitude", String(lng))
  forecastUrl.searchParams.set("hourly", "pressure_msl,temperature_2m,uv_index")
  forecastUrl.searchParams.set("timezone", "auto")
  forecastUrl.searchParams.set("forecast_days", "1")

  const aqUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality")
  aqUrl.searchParams.set("latitude", String(lat))
  aqUrl.searchParams.set("longitude", String(lng))
  aqUrl.searchParams.set("current", "european_aqi")
  aqUrl.searchParams.set("timezone", "auto")

  // Fetch both in parallel; AQI failure is non-fatal
  const [forecastRes, aqRes] = await Promise.all([
    fetch(forecastUrl.toString()),
    fetch(aqUrl.toString()).catch(() => null),
  ])

  if (!forecastRes.ok) {
    throw new Error(`Open-Meteo forecast responded with ${forecastRes.status}`)
  }

  const forecast = (await forecastRes.json()) as ForecastResponse

  const currentHour = new Date().getHours()
  const pressure_hpa = forecast.hourly.pressure_msl[currentHour] ?? forecast.hourly.pressure_msl[0] ?? null
  const temperature_c = forecast.hourly.temperature_2m[currentHour] ?? forecast.hourly.temperature_2m[0] ?? null
  const uv_index = forecast.hourly.uv_index[currentHour] ?? forecast.hourly.uv_index[0] ?? null
  const pressure_drop_forecast = computePressureDropForecast(forecast.hourly.pressure_msl, currentHour)

  let aqi: number | null = null
  if (aqRes?.ok) {
    try {
      const aqJson = (await aqRes.json()) as AirQualityResponse
      aqi = aqJson.current?.european_aqi ?? null
    } catch {
      // AQI parse failure is non-fatal
    }
  }

  return {
    pressure_hpa,
    pressure_delta_6h: null,
    temperature_c,
    aqi,
    uv_index,
    location_lat: lat,
    location_lng: lng,
    pressure_drop_forecast,
  }
}
