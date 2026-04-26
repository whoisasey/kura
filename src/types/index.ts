export interface WeatherReading {
  id: string
  user_id: string
  recorded_at: string
  pressure_hpa: number | null
  pressure_delta_6h: number | null
  temperature_c: number | null
  aqi: number | null
  uv_index: number | null
  location_lat: number | null
  location_lng: number | null
  pressure_drop_forecast: boolean | null
}

export interface EnvAlerts {
  pressureDelta: number | null
  pressureDropForecast: boolean
  aqiAlert: boolean
  aqi: number | null
  uvHigh: boolean
  uvIndex: number | null
  temperatureC: number | null
  lastUpdated: string | null
}
