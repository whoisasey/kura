'use client'

import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material'
import type { CycleInsight } from '@/types/index'

interface TransitionCardProps {
  insight: CycleInsight | null
  loading: boolean
}

const TransitionCard = ({ insight, loading }: TransitionCardProps) => {
  return (
    <Card elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {loading && (
          <>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="30%" height={20} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="80%" height={20} />
          </>
        )}

        {!loading && !insight && (
          <Typography variant="body2" color="text.disabled">
            Log your first period to see what's coming up.
          </Typography>
        )}

        {!loading && insight && (
          <>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Coming up —{' '}
              <Box component="span" sx={{ color: 'success.main', textTransform: 'capitalize' }}>
                {insight.transition_briefing.next_phase_name}
              </Box>
            </Typography>

            <Typography variant="caption" color="text.disabled">
              In about {insight.transition_briefing.arriving_in_days}{' '}
              {insight.transition_briefing.arriving_in_days === 1 ? 'day' : 'days'}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {insight.transition_briefing.whats_shifting}
            </Typography>

            {insight.transition_briefing.how_to_prepare.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.disabled" fontWeight={500} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  How to prepare now
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                  {insight.transition_briefing.how_to_prepare.map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main', mt: '6px', flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary">
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Box
              sx={{
                bgcolor: 'success.main',
                opacity: 0.9,
                borderRadius: 2,
                px: 1.5,
                py: 1,
              }}
            >
              <Typography variant="caption" sx={{ color: 'background.default', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Something to look forward to
              </Typography>
              <Typography variant="body2" sx={{ color: 'background.default', mt: 0.25 }}>
                {insight.transition_briefing.what_to_look_forward_to}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default TransitionCard
