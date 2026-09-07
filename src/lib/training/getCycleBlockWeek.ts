export type BlockWeekNumber = 1 | 2 | 3 | 4;

// Late luteal deload starts 7 days before predicted period.
// e.g. avg cycle 29 days → deload from day 23 onward.
const lateLutealStart = (avgCycleLength: number) => avgCycleLength - 6;

export const getCycleBlockWeek = (cycleDay: number, avgCycleLength = 29): BlockWeekNumber => {
  if (cycleDay <= 7) return 1;
  if (cycleDay <= 14) return 2;
  if (cycleDay <= 17) return 3;
  if (cycleDay >= lateLutealStart(avgCycleLength)) return 1;
  return 4;
};

export const isPrePeriodDeload = (cycleDay: number, avgCycleLength = 29): boolean =>
  cycleDay >= lateLutealStart(avgCycleLength);

export const getDaysUntilNextPhase = (cycleDay: number, avgCycleLength = 29): number => {
  if (cycleDay <= 7) return 8 - cycleDay;
  if (cycleDay <= 14) return 15 - cycleDay;
  if (cycleDay <= 17) return 18 - cycleDay;
  if (cycleDay >= lateLutealStart(avgCycleLength)) {
    // Days until predicted period start
    return Math.max(0, avgCycleLength - cycleDay + 1);
  }
  // Week 4 — days until late luteal deload begins
  return lateLutealStart(avgCycleLength) - cycleDay;
};

export const getNextPhaseName = (cycleDay: number, avgCycleLength = 29): string => {
  if (cycleDay <= 7) return "follicular build";
  if (cycleDay <= 14) return "peak week";
  if (cycleDay <= 17) return "wind-down";
  if (cycleDay >= lateLutealStart(avgCycleLength)) return "period start";
  return "deload";
};

export const getPhaseTransitionMessage = (cycleDay: number, avgCycleLength = 29): string | null => {
  if (cycleDay === 1) return "Period started — deload continues. Trim sets, drop to bodyweight, or swap sessions for rest.";
  if (cycleDay === lateLutealStart(avgCycleLength)) return "Late luteal deload begins — easing load now supports recovery heading into your period.";
  if (cycleDay === 15) return "Ovulatory window — good days to push PRs on lifts and runs.";
  return null;
};
