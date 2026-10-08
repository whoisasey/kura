export type CyclePhase = "menstrual" | "follicular" | "ovulation" | "luteal";

// Canonical phase day boundaries — the single source of truth for where one
// phase ends and the next begins. Anything that needs to reason about phase
// timing (training block, AI prompts, etc.) should import these rather than
// re-deriving its own thresholds, which is how training previously drifted
// out of sync with the cycle feature's own phase math.
export const MENSTRUAL_END_DAY = 5;
export const FOLLICULAR_END_DAY = 13;
export const OVULATION_END_DAY = 16;

export const computeCycleDay = (periodStart: string, localDate?: string): number => {
  const [sy, sm, sd] = periodStart.split("-").map(Number);
  const todayStr = localDate ?? new Date().toLocaleDateString("en-CA");
  const [ty, tm, td] = todayStr.split("-").map(Number);
  const startMs = Date.UTC(sy, sm - 1, sd);
  const todayMs = Date.UTC(ty, tm - 1, td);
  return Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
};

export const computePhase = (cycleDay: number, avgCycleLength: number = 28): CyclePhase => {
  if (cycleDay <= MENSTRUAL_END_DAY) return "menstrual";
  if (cycleDay <= FOLLICULAR_END_DAY) return "follicular";
  if (cycleDay <= OVULATION_END_DAY) return "ovulation";
  // luteal runs from day 17 to end of cycle
  void avgCycleLength;
  return "luteal";
};

export const daysUntilNextPhase = (cycleDay: number, cycleLength: number = 28): number => {
  if (cycleDay <= MENSTRUAL_END_DAY) return MENSTRUAL_END_DAY - cycleDay + 1;
  if (cycleDay <= FOLLICULAR_END_DAY) return FOLLICULAR_END_DAY - cycleDay + 1;
  if (cycleDay <= OVULATION_END_DAY) return OVULATION_END_DAY - cycleDay + 1;
  return Math.max(1, cycleLength - cycleDay + 1);
};

export const getNextPhaseLabel = (cycleDay: number): string => {
  if (cycleDay <= MENSTRUAL_END_DAY) return "follicular build";
  if (cycleDay <= FOLLICULAR_END_DAY) return "peak week";
  if (cycleDay <= OVULATION_END_DAY) return "luteal wind-down";
  return "period start";
};

export const computeAvgCycleInterval = (periodStarts: string[]): number => {
  if (periodStarts.length < 2) return 28;
  const sorted = [...periodStarts].sort((a, b) => (a > b ? -1 : 1));
  const intervals: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const days = Math.round(
      (new Date(sorted[i]).getTime() - new Date(sorted[i + 1]).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days > 14 && days < 60) intervals.push(days);
  }
  if (intervals.length === 0) return 28;
  return Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
};

export const computePredictedNextPeriod = (periodStarts: string[]): string | null => {
  if (periodStarts.length === 0) return null;
  const sorted = [...periodStarts].sort((a, b) => (a > b ? -1 : 1));
  const interval = computeAvgCycleInterval(sorted);
  const next = new Date(sorted[0]);
  next.setDate(next.getDate() + interval);
  return next.toISOString().split("T")[0];
};
