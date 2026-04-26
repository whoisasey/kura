"use client"

import { Alert, Box } from "@mui/material"
import AirRoundedIcon from "@mui/icons-material/AirRounded"
import type { EnvAlerts } from "@/types/index"

interface Props {
  alerts: EnvAlerts
}

const EnvBanner = ({ alerts }: Props) => {
  if (alerts.lastUpdated === null) return null

  const delta = alerts.pressureDelta

  const pressureDropping = delta !== null && delta <= -3
  const pressureRising = delta !== null && delta >= 3
  const pressureForecast = alerts.pressureDropForecast && !pressureDropping

  const pressureMessage = pressureDropping
    ? "Pressure is dropping — stay hydrated and take it easy today."
    : pressureForecast
    ? "Pressure is stable now but expected to drop later — worth staying ahead of hydration."
    : pressureRising
    ? "Pressure is rising — conditions are looking up today."
    : "Pressure is stable today."

  const pressureSeverity = pressureDropping || pressureForecast ? "warning" : "success"

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Alert
        severity={pressureSeverity}
        icon={<AirRoundedIcon />}
        sx={{ borderRadius: 2 }}
      >
        {pressureMessage}
      </Alert>

      {alerts.aqiAlert && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Air quality is elevated — lighter outdoor activity is recommended.
        </Alert>
      )}
    </Box>
  )
}

export default EnvBanner
