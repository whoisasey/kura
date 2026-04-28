'use client'

import { Box, Card, CardContent, Chip, Skeleton, Typography } from '@mui/material'
import type { CycleInsight } from '@/types/index'

interface SymptomForecastCardProps {
  insight: CycleInsight | null
  loading: boolean
}

const SymptomForecastCard = ({ insight, loading }: SymptomForecastCardProps) => {
  if (loading) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="65%" />
        </CardContent>
      </Card>
    )
  }

  const forecast = insight?.symptom_forecast
  if (!forecast || forecast.upcoming.length === 0) return null

  return (
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
          Symptom Forecast
        </Typography>
        {forecast.upcoming.map((item, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 500 }}>
                {item.symptom}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.days_away === 0
                  ? `around today (day ${item.likely_day})`
                  : `in ~${item.days_away} day${item.days_away === 1 ? '' : 's'} · day ${item.likely_day}`}
              </Typography>
            </Box>
            <Chip
              label={item.confidence}
              size="small"
              sx={{
                fontSize: '0.65rem',
                height: 20,
                bgcolor: item.confidence === 'likely' ? 'warning.main' : 'action.selected',
                color: item.confidence === 'likely' ? 'warning.contrastText' : 'text.secondary',
              }}
            />
          </Box>
        ))}
      </CardContent>
    </Card>
  )
}

export default SymptomForecastCard
