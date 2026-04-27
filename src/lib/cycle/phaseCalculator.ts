export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export const computeCycleDay = (periodStart: string): number => {
  const [y, m, d] = periodStart.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

export const computePhase = (cycleDay: number, avgCycleLength: number = 28): CyclePhase => {
  if (cycleDay <= 5) return 'menstrual'
  if (cycleDay <= 13) return 'follicular'
  if (cycleDay <= 16) return 'ovulation'
  // luteal runs from day 17 to end of cycle
  void avgCycleLength
  return 'luteal'
}

export const daysUntilNextPhase = (cycleDay: number): number => {
  if (cycleDay <= 5) return 5 - cycleDay + 1
  if (cycleDay <= 13) return 13 - cycleDay + 1
  if (cycleDay <= 16) return 16 - cycleDay + 1
  // luteal ends at day 28 by default
  return 28 - cycleDay + 1
}

export const computeAvgCycleInterval = (periodStarts: string[]): number => {
  if (periodStarts.length < 2) return 28
  const sorted = [...periodStarts].sort((a, b) => (a > b ? -1 : 1))
  const intervals: number[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const days = Math.round(
      (new Date(sorted[i]).getTime() - new Date(sorted[i + 1]).getTime()) /
        (1000 * 60 * 60 * 24)
    )
    if (days > 14 && days < 60) intervals.push(days)
  }
  if (intervals.length === 0) return 28
  return Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
}

export const computePredictedNextPeriod = (periodStarts: string[]): string | null => {
  if (periodStarts.length === 0) return null
  const sorted = [...periodStarts].sort((a, b) => (a > b ? -1 : 1))
  const interval = computeAvgCycleInterval(sorted)
  const next = new Date(sorted[0])
  next.setDate(next.getDate() + interval)
  return next.toISOString().split('T')[0]
}
