'use client'

import { Box, Card, CardContent, Chip, Skeleton, Typography } from '@mui/material'
import type { CycleInsight } from '@/types/index'

interface ExerciseCardProps {
  insight: CycleInsight | null
  loading: boolean
}

const ExerciseCard = ({ insight, loading }: ExerciseCardProps) => {
  return (
    <Card elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Movement today
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
            <Typography variant="h3" color="primary.main" fontWeight={700}>
              {insight.exercise.recommended_type}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={insight.exercise.intensity}
                size="small"
                sx={{ textTransform: 'capitalize', bgcolor: 'background.default' }}
              />
              <Chip
                label={`${insight.exercise.duration_minutes} min`}
                size="small"
                sx={{ bgcolor: 'background.default' }}
              />
              <Chip
                label={insight.phase}
                size="small"
                sx={{ textTransform: 'capitalize', bgcolor: 'background.default' }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary">
              {insight.exercise.rationale}
            </Typography>

            {insight.exercise.avoid.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.disabled" fontWeight={500} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  What to skip
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                  {insight.exercise.avoid.map((item, i) => (
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

            {insight.exercise.if_you_feel_up_to_more && (
              <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                If you feel up to more: {insight.exercise.if_you_feel_up_to_more}
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ExerciseCard
