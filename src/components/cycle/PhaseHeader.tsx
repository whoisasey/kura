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
}

const PhaseHeader = ({ insight, loading }: PhaseHeaderProps) => {
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
    </Box>
  )
}

export default PhaseHeader
