export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export const computeCycleDay = (periodStart: string): number => {
  const start = new Date(periodStart)
  const today = new Date()
  start.setHours(0, 0, 0, 0)
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
