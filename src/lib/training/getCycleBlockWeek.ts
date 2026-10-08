import { FOLLICULAR_END_DAY } from "@/lib/cycle/phaseCalculator";

export type BlockWeekNumber = 1 | 2 | 3 | 4;

export interface CycleBlockWeekInfo {
  weekNumber: BlockWeekNumber;
  weekStartDate: string; // ISO date (Sunday) of the calendar week being shown
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const parseISO = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const toISO = (date: Date): string => date.toISOString().split("T")[0];

const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * MS_PER_DAY);

const startOfWeek = (date: Date): Date => addDays(date, -date.getUTCDay());

// Which 4-week training block "today" falls in — anchored to real calendar
// weeks (Sun–Sat), not a floating day-count, so the block lines up the same
// way regardless of which weekday the period lands on. Deliberately separate
// from cycle PHASE (phaseCalculator.ts): phase is about hormones and is
// purely day-count based; block week is about which 7-day chunk of training
// content to show, snapped to calendar weeks.
//
//   Week 1 — the calendar week the period starts in (menstrual, deload)
//   Week 2 — the following calendar week (follicular, build)
//   Week 3 — everything between Week 2 and Week 4 (ovulation → peak; absorbs
//            any extra calendar weeks on longer-than-average cycles)
//   Week 4 — the calendar week immediately before the next period (late
//            luteal, deload)
//
// The anchor (most recent logged period_start) is projected forward by whole
// cycle lengths until it brackets today, so a late/overdue period doesn't
// break the mapping — and because it's recomputed from the latest actual
// period_start + avg cycle length every time, the blocks re-align themselves
// whenever a period shifts earlier or later than predicted.
export const getCycleBlockWeekInfo = (
  periodStart: string,
  avgCycleLength: number,
  today: string = new Date().toLocaleDateString("en-CA")
): CycleBlockWeekInfo => {
  const todayDate = parseISO(today);
  const anchor = parseISO(periodStart);

  const daysSinceAnchor = Math.round((todayDate.getTime() - anchor.getTime()) / MS_PER_DAY);
  const cyclesElapsed = Math.floor(daysSinceAnchor / avgCycleLength);
  const virtualPeriodStart = addDays(anchor, cyclesElapsed * avgCycleLength);
  const virtualNextPeriodStart = addDays(virtualPeriodStart, avgCycleLength);

  const week1Start = startOfWeek(virtualPeriodStart);
  const week2Start = addDays(week1Start, 7);
  const week4Start = startOfWeek(addDays(virtualNextPeriodStart, -7));

  if (todayDate < addDays(week1Start, 7)) {
    return { weekNumber: 1, weekStartDate: toISO(week1Start) };
  }
  if (todayDate < addDays(week2Start, 7)) {
    return { weekNumber: 2, weekStartDate: toISO(week2Start) };
  }
  if (todayDate >= week4Start) {
    return { weekNumber: 4, weekStartDate: toISO(week4Start) };
  }
  return { weekNumber: 3, weekStartDate: toISO(startOfWeek(todayDate)) };
};

// One-off callouts for the day a training block boundary is crossed —
// separate from the block-week lookup above since these fire on specific
// calendar days rather than describing a range.
export const getBlockTransitionMessage = (
  cycleDay: number,
  weekInfo: CycleBlockWeekInfo,
  today: string = new Date().toLocaleDateString("en-CA")
): string | null => {
  if (cycleDay === 1) return "Period started — deload continues. Trim sets, drop to bodyweight, or swap sessions for rest.";
  if (weekInfo.weekNumber === 4 && weekInfo.weekStartDate === today) {
    return "Late luteal deload begins — easing load now supports recovery heading into your period.";
  }
  if (cycleDay === FOLLICULAR_END_DAY + 1) return "Ovulatory window — good days to push PRs on lifts and runs.";
  return null;
};
