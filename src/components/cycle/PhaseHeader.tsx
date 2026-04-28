'use client'

import { Box, Skeleton, Typography } from '@mui/material'
import type { CycleInsight, CyclePhase } from '@/types/index'

const phaseColors: Record<CyclePhase, string> = {
  menstrual: '#D4853A',
  follicular: '#6B8F71',
  ovulation: '#8B5A3A',
  luteal: '#9C7BB5',
}

const phaseLabel: Record<CyclePhase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulation: 'Ovulation',
  luteal: 'Luteal',
}

interface PhaseHeaderProps {
  insight: CycleInsight | null
  loading: boolean
  predictedNextPeriod: string | null
}

const formatPredictedDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (days <= 0) return 'around now'
  if (days === 1) return 'tomorrow'
  if (days < 7) return `in ${days} days`
  if (days < 14) return `in about a week`

  return `~${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

const PhaseHeader = ({ insight, loading, predictedNextPeriod }: PhaseHeaderProps) => {
  if (loading) {
    return (
      <Box sx={{ pt: 1 }}>
        <Skeleton variant="text" width="50%" height={48} />
        <Skeleton variant="text" width="30%" height={24} />
      </Box>
    )
  }

  if (!insight) {
    return (
      <Box sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.disabled">
          Log your first period to get started
        </Typography>
      </Box>
    )
  }

  const color = phaseColors[insight.phase]

  return (
    <Box sx={{ pt: 1 }}>
      <Typography
        variant="h1"
        sx={{ fontSize: '2rem', fontWeight: 700, color, textTransform: 'capitalize' }}
      >
        {phaseLabel[insight.phase]}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 0.25 }}>
        Day {insight.cycle_day}
      </Typography>
      <Typography variant="caption" color="text.disabled">
        {insight.days_until_next_phase} {insight.days_until_next_phase === 1 ? 'day' : 'days'} until{' '}
        {phaseLabel[insight.next_phase].toLowerCase()}
      </Typography>
      {predictedNextPeriod && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
          Next period {formatPredictedDate(predictedNextPeriod)}
        </Typography>
      )}
    </Box>
  )
}

export default PhaseHeader
