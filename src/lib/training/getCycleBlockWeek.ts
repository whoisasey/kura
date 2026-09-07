export type BlockWeekNumber = 1 | 2 | 3 | 4;

export const getCycleBlockWeek = (cycleDay: number): BlockWeekNumber => {
  if (cycleDay <= 7) return 1;
  if (cycleDay <= 14) return 2;
  if (cycleDay <= 17) return 3;
  return 4;
};

export const getDaysUntilNextPhase = (cycleDay: number): number => {
  if (cycleDay <= 7) return 8 - cycleDay;
  if (cycleDay <= 14) return 15 - cycleDay;
  if (cycleDay <= 17) return 18 - cycleDay;
  // Week 4: estimate next cycle at day 29
  return Math.max(0, 29 - cycleDay);
};

export const getNextPhaseName = (cycleDay: number): string => {
  if (cycleDay <= 7) return "follicular build";
  if (cycleDay <= 14) return "peak week";
  if (cycleDay <= 17) return "wind-down";
  return "next deload";
};

export const getPhaseTransitionMessage = (cycleDay: number): string | null => {
  if (cycleDay === 1) return "Period started — Week 1 deload begins now. Trim sets, drop to bodyweight, or swap sessions for rest.";
  if (cycleDay >= 26) return "Period likely arriving soon — this week's sessions are already easing off.";
  if (cycleDay === 15) return "Ovulatory window — good days to push PRs on lifts and runs.";
  return null;
};
