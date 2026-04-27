'use client'

import { Box, Tooltip } from '@mui/material'
import { computeCycleDay, computePhase, computeAvgCycleInterval } from '@/lib/cycle/phaseCalculator'
import type { CyclePhase } from '@/lib/cycle/phaseCalculator'
import type { Cycle } from '@/types/index'

const phaseFill: Record<CyclePhase, string> = {
  menstrual: '#D4853A',
  follicular: '#6B8F71',
  ovulation: '#8B7A6B',
  luteal: '#9C7BB5',
}

interface CycleCalendarProps {
  latestCycle: Cycle | null
  cycles: Cycle[]
}

const CycleCalendar = ({ latestCycle, cycles }: CycleCalendarProps) => {
  const periodStarts = cycles.map((c) => c.period_start)
  const avgInterval = computeAvgCycleInterval(periodStarts)
  const totalDays = Math.max(avgInterval, 28)
  const todayCycleDay = latestCycle ? computeCycleDay(latestCycle.period_start) : null

  // Predicted period: starts at avgInterval days from period_start (cycle day = avgInterval)
  // Show predicted menstrual dots for 5 days after totalDays
  const predictedPeriodDays = Array.from({ length: 5 }, (_, i) => totalDays + 1 + i)

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: '6px',
        overflowX: 'auto',
        py: 1,
        px: 0.5,
        '&::-webkit-scrollbar': { display: 'none' },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
    >
      {Array.from({ length: totalDays }, (_, i) => {
        const day = i + 1
        const phase = computePhase(day, avgInterval)
        const fill = phaseFill[phase]
        const isToday = todayCycleDay !== null && day === todayCycleDay
        const isFuture = todayCycleDay !== null && day > todayCycleDay
        const noData = todayCycleDay === null

        const size = isToday ? 28 : 24
        const opacity = noData ? 0.3 : isFuture ? 0.4 : 1

        return (
          <Tooltip key={day} title={`Day ${day} · ${phase}`} placement="top">
            <Box
              sx={{
                width: size,
                height: size,
                borderRadius: '50%',
                bgcolor: noData ? 'text.disabled' : fill,
                opacity,
                flexShrink: 0,
                outline: isToday ? '2px solid white' : 'none',
                outlineOffset: '1px',
                boxShadow: isToday ? `0 0 0 3px ${fill}` : 'none',
                transition: 'width 0.15s, height 0.15s',
              }}
            />
          </Tooltip>
        )
      })}

      {/* Predicted period dots */}
      {todayCycleDay !== null && predictedPeriodDays.map((day) => (
        <Tooltip key={`pred-${day}`} title={`Predicted period · day ${day - totalDays}`} placement="top">
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: 'transparent',
              border: `2px dashed ${phaseFill.menstrual}`,
              opacity: 0.5,
              flexShrink: 0,
            }}
          />
        </Tooltip>
      ))}
    </Box>
  )
}

export default CycleCalendar
