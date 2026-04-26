"use client"

import { Box, Card, CardContent, Chip, Skeleton, Typography } from "@mui/material"
import type { WeatherReading } from "@/types/index"

interface Props {
  reading: WeatherReading | null
  loading: boolean
}

const relativeTime = (isoString: string): string => {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

const aqiLabel = (aqi: number): string => {
  if (aqi <= 20) return "Good"
  if (aqi <= 50) return "Fair"
  return "Poor"
}

const uvLabel = (uv: number): string => {
  if (uv < 3) return "Low"
  if (uv < 6) return "Moderate"
  return "High"
}

const StatCell = ({
  label,
  value,
  badge,
  badgeColor,
}: {
  label: string
  value: string
  badge?: string
  badgeColor?: "default" | "warning"
}) => (
  <Box
    sx={{
      bgcolor: "background.paper",
      border: "0.5px solid",
      borderColor: "divider",
      borderRadius: 2,
      p: 1.5,
      display: "flex",
      flexDirection: "column",
      gap: 0.5,
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
      <Typography variant="body1" fontWeight={500}>
        {value}
      </Typography>
      {badge && (
        <Chip
          label={badge}
          size="small"
          color={badgeColor === "warning" ? "warning" : "default"}
          sx={{ height: 18, fontSize: "0.65rem" }}
        />
      )}
    </Box>
  </Box>
)

const SkeletonCell = () => (
  <Box
    sx={{
      bgcolor: "background.paper",
      border: "0.5px solid",
      borderColor: "divider",
      borderRadius: 2,
      p: 1.5,
    }}
  >
    <Skeleton variant="text" width={48} height={16} />
    <Skeleton variant="text" width={72} height={24} sx={{ mt: 0.5 }} />
  </Box>
)

const EnvCard = ({ reading, loading }: Props) => {
  return (
    <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Environment
        </Typography>

        {loading ? (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            <SkeletonCell />
            <SkeletonCell />
            <SkeletonCell />
            <SkeletonCell />
          </Box>
        ) : reading === null ? (
          <Typography variant="body2" color="text.secondary">
            Environment data unavailable
          </Typography>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            <StatCell
              label="Pressure"
              value={reading.pressure_hpa !== null ? `${reading.pressure_hpa} hPa` : "—"}
              badge={
                reading.pressure_delta_6h !== null && reading.pressure_delta_6h <= -3
                  ? `${reading.pressure_delta_6h.toFixed(1)}`
                  : reading.pressure_drop_forecast
                  ? "Drop forecast"
                  : reading.pressure_delta_6h !== null
                  ? `${reading.pressure_delta_6h > 0 ? "+" : ""}${reading.pressure_delta_6h.toFixed(1)}`
                  : undefined
              }
              badgeColor={
                (reading.pressure_delta_6h !== null && reading.pressure_delta_6h <= -3) ||
                reading.pressure_drop_forecast
                  ? "warning"
                  : "default"
              }
            />
            <StatCell
              label="AQI"
              value={reading.aqi !== null ? String(reading.aqi) : "—"}
              badge={reading.aqi !== null ? aqiLabel(reading.aqi) : undefined}
              badgeColor={reading.aqi !== null && reading.aqi > 50 ? "warning" : "default"}
            />
            <StatCell
              label="UV"
              value={reading.uv_index !== null ? String(reading.uv_index) : "—"}
              badge={reading.uv_index !== null ? uvLabel(reading.uv_index) : undefined}
              badgeColor={reading.uv_index !== null && reading.uv_index >= 6 ? "warning" : "default"}
            />
            <StatCell
              label="Temp"
              value={reading.temperature_c !== null ? `${reading.temperature_c}°C` : "—"}
            />
          </Box>
        )}

        {!loading && reading?.recorded_at && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
            Updated {relativeTime(reading.recorded_at)}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default EnvCard
