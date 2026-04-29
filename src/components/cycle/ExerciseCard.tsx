'use client'

import { Box, Card, CardContent, Chip, Divider, Skeleton, Typography } from '@mui/material'
import type { CycleInsight } from '@/types/index'

interface ExerciseCardProps {
  insight: CycleInsight | null
  loading: boolean
}

interface ExerciseSectionProps {
  exercise: CycleInsight['exercise']
  phase?: string
}

const ExerciseSection = ({ exercise, phase }: ExerciseSectionProps) => (
  <>
    <Typography variant="h3" color="primary.main" fontWeight={700}>
      {exercise.recommended_type}
    </Typography>

    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      <Chip
        label={exercise.intensity}
        size="small"
        sx={{ textTransform: 'capitalize', bgcolor: 'background.default' }}
      />
      <Chip
        label={`${exercise.duration_minutes} min`}
        size="small"
        sx={{ bgcolor: 'background.default' }}
      />
      {phase && (
        <Chip
          label={phase}
          size="small"
          sx={{ textTransform: 'capitalize', bgcolor: 'background.default' }}
        />
      )}
    </Box>

    <Typography variant="body2" color="text.secondary">
      {exercise.rationale}
    </Typography>

    {exercise.avoid.length > 0 && (
      <Box>
        <Typography variant="caption" color="text.disabled" fontWeight={500} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          What to skip
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
          {exercise.avoid.map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled', mt: '6px', flexShrink: 0 }} />
              <Typography variant="body2" color="text.disabled">
                {item}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    )}

    {exercise.if_you_feel_up_to_more && (
      <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
        If you feel up to more: {exercise.if_you_feel_up_to_more}
      </Typography>
    )}
  </>
)

const ExerciseCard = ({ insight, loading }: ExerciseCardProps) => {
  return (
    <Card elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Movement
        </Typography>

        {loading && (
          <>
            <Skeleton variant="text" width="50%" height={32} />
            <Skeleton variant="rounded" width="100%" height={32} />
            <Skeleton variant="text" width="90%" height={20} />
          </>
        )}

        {!loading && !insight && (
          <Typography variant="body2" color="text.disabled">
            Log your first period to get movement recommendations.
          </Typography>
        )}

        {!loading && insight && (
          <>
            <Typography variant="caption" color="text.disabled" fontWeight={500} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Today
            </Typography>
            <ExerciseSection exercise={insight.exercise} phase={insight.phase} />

            {insight.tomorrow_exercise && (
              <>
                <Divider sx={{ my: 0.5 }} />
                <Typography variant="caption" color="text.disabled" fontWeight={500} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Tomorrow
                </Typography>
                <ExerciseSection exercise={insight.tomorrow_exercise} />
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ExerciseCard
