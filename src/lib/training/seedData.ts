import type { TrainingPlan } from "@/types/training";

// 4-week cycle-synced block in TrainingPlan format.
// No weekStartDate — currentWeek is derived from cycleDay on the training page.
export const cycleBlockPlan: TrainingPlan = {
  name: "4-Week Cycle Block",
  description: "Cycle-synced training anchored to period start — deload, build, peak, wind-down",
  totalWeeks: 4,
  currentWeek: 1,
  weeks: [
    {
      weekNumber: 1,
      phase: "Deload",
      isDeload: true,
      sessions: [
        { dayOfWeek: 0, type: "yoga", label: "Yoga (restorative) or rest" },
        { dayOfWeek: 1, type: "physio", label: "Physio activation", sub: "Bodyweight only — bands in place of DBs" },
        { dayOfWeek: 2, type: "resistance", label: "Light resistance", sub: "Bands only, sliders skipped" },
        { dayOfWeek: 3, type: "pilates", label: "Pilates flow + ball" },
        { dayOfWeek: 4, type: "physio", label: "Physio activation", sub: "Low intensity — balance + ankle work" },
        { dayOfWeek: 5, type: "run", label: "Optional walk / short jog", sub: "10–15 min, skip if fatigued" },
        { dayOfWeek: 6, type: "yoga", label: "Yoga class" },
      ],
    },
    {
      weekNumber: 2,
      phase: "Follicular — Build",
      sessions: [
        { dayOfWeek: 0, type: "yoga", label: "Yoga class" },
        { dayOfWeek: 1, type: "physio", label: "Physio activation + core", sub: "DB goblet squat + SL glute bridge added" },
        { dayOfWeek: 2, type: "resistance", label: "Light resistance", sub: "Sliders + bands + DB overhead press" },
        { dayOfWeek: 3, type: "pilates", label: "Pilates flow + ball" },
        { dayOfWeek: 4, type: "physio", label: "Physio + balance", sub: "Slider adductor slides + SL balance reach" },
        { dayOfWeek: 5, type: "run", label: "Easy run", sub: "20–25 min @ ~6:30–6:45/km", distanceKm: 3.5 },
        { dayOfWeek: 6, type: "heavy", label: "Heavy lift — posterior chain / hinge" },
      ],
    },
    {
      weekNumber: 3,
      phase: "Ovulatory → early luteal — Peak",
      sessions: [
        { dayOfWeek: 0, type: "yoga", label: "Yoga class" },
        { dayOfWeek: 1, type: "pilates", label: "Pilates flow + ball" },
        { dayOfWeek: 2, type: "physio", label: "Physio + balance", sub: "Adductor work + slider slides + SL balance" },
        { dayOfWeek: 3, type: "physio", label: "Physio activation + core", sub: "Full sequence with DBs" },
        { dayOfWeek: 4, type: "resistance", label: "Light resistance", sub: "Sliders + bands + DB overhead press" },
        { dayOfWeek: 5, type: "run", label: "Easy run + strides", sub: "20–30 min + optional 4–6×20s strides", distanceKm: 4 },
        { dayOfWeek: 6, type: "heavy", label: "Heavy lift — posterior chain / hinge" },
      ],
    },
    {
      weekNumber: 4,
      phase: "Late luteal — Wind-down",
      sessions: [
        { dayOfWeek: 0, type: "yoga", label: "Yoga class" },
        { dayOfWeek: 1, type: "physio", label: "Physio + balance", sub: "Band work — sliders swapped out" },
        { dayOfWeek: 2, type: "physio", label: "Physio activation + core", sub: "Full sequence, no slider adductor" },
        { dayOfWeek: 3, type: "resistance", label: "Light resistance", sub: "Sliders reduced range, trimmed volume" },
        { dayOfWeek: 4, type: "pilates", label: "Pilates flow + ball" },
        { dayOfWeek: 5, type: "run", label: "Easy run, pace buffer", sub: "20–25 min @ ~7:00–7:15/km", distanceKm: 3 },
        { dayOfWeek: 6, type: "heavy", label: "Heavy lift — moderate RPE" },
      ],
    },
  ],
};
