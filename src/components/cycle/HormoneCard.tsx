'use client'

import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import type { CycleInsight } from '@/types/index'

interface HormoneCardProps {
  insight: CycleInsight | null
  loading: boolean
}

const HormoneCard = ({ insight, loading }: HormoneCardProps) => {
  return (
    <Card elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          What's happening today
        </Typography>

        {loading && (
          <>
            <Skeleton variant="text" width="70%" height={24} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="90%" height={20} />
            <Skeleton variant="text" width="60%" height={20} />
          </>
        )}

        {!loading && !insight && (
          <Typography variant="body2" color="text.disabled">
            Log your first period to see your daily hormone note.
          </Typography>
        )}

        {!loading && insight && (
          <>
            <Typography variant="body1" fontWeight={600}>
              {insight.hormone_note.headline}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {insight.hormone_note.whats_happening}
            </Typography>

            {insight.hormone_note.what_to_expect.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.disabled" fontWeight={500} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  What to expect
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 0.75 }}>
                  {insight.hormone_note.what_to_expect.map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          mt: '6px',
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {insight.hormone_note.heads_up && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  bgcolor: 'warning.main',
                  opacity: 0.9,
                  borderRadius: 2,
                  px: 1.5,
                  py: 1,
                }}
              >
                <WarningAmberRoundedIcon sx={{ fontSize: 18, color: 'background.default', mt: '1px', flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: 'background.default' }}>
                  {insight.hormone_note.heads_up}
                </Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default HormoneCard
