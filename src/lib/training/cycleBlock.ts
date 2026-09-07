export type BlockSessionType = "physio" | "resistance" | "pilates" | "run" | "yoga" | "rest";

export interface BlockDay {
  day: "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  sessionType: BlockSessionType;
  label: string;
  exercises?: string[];
  note?: string;
  isWeekend?: boolean;
  isOptional?: boolean;
}

export interface BlockWeek {
  week: 1 | 2 | 3 | 4;
  phase: string;
  intent: string;
  weekNote?: string;
  days: BlockDay[];
}

export const CYCLE_BLOCK: BlockWeek[] = [
  {
    week: 1,
    phase: "Late luteal → menstruation",
    intent: "Deload — recovery, not performance",
    weekNote: "This whole week is maintenance, not performance. Trim sets, drop to bodyweight, or swap a session for rest wherever your body's asking for it.",
    days: [
      {
        day: "Sunday",
        dayOfWeek: 0,
        sessionType: "yoga",
        label: "Yoga (restorative) or rest",
        isWeekend: true,
        isOptional: true,
      },
      {
        day: "Monday",
        dayOfWeek: 1,
        sessionType: "physio",
        label: "Physio activation, bodyweight only",
        exercises: [
          "Stork drill (right first) — 3×10 ea",
          "Triple extension wall switches (right first) — 3×8 ea",
          "Banded single-leg glute bridge (right first) — 3×10 ea",
          "Bodyweight squat, slow tempo — 2×12",
          "Short foot exercise — 2×20s hold ea",
          "Dead bug — 3×8 ea",
          "90/90 hip switches — 2 min",
        ],
        note: "DBs swapped for bands — no loaded glute bridge or goblet squat this week",
      },
      {
        day: "Tuesday",
        dayOfWeek: 2,
        sessionType: "resistance",
        label: "Light resistance, bands only",
        exercises: [
          "Band pull-aparts — 3×15",
          "Band Romanian deadlift, controlled — 3×10",
          "Band lateral walks — 2×10 steps ea direction",
          "Band pallof press — 2×10 ea side",
        ],
        note: "Sliders skipped this week — no eccentric-heavy loading during period",
      },
      {
        day: "Wednesday",
        dayOfWeek: 3,
        sessionType: "pilates",
        label: "Pilates flow + ball",
        exercises: [
          "Mat Pilates flow — 18 min",
          "Ball between knees, bridges — 3×12",
          "Toe spread and splay — 2×15",
        ],
      },
      {
        day: "Thursday",
        dayOfWeek: 4,
        sessionType: "physio",
        label: "Physio activation, low intensity",
        exercises: [
          "Ball squeeze adductor isometric — 3×15s hold",
          "Single-leg balance reach, gentle (right first) — 3×8 ea",
          "Calf raises, light — 2×12",
          "Banded ankle inversion/eversion — 2×15 ea",
        ],
      },
      {
        day: "Friday",
        dayOfWeek: 5,
        sessionType: "run",
        label: "Optional easy walk / very short jog",
        exercises: [
          "10–15 min easy walk, or an easy jog only if energy allows",
        ],
        note: "Fully optional in days 1–3 of period — skip without guilt if fatigued",
        isOptional: true,
      },
      {
        day: "Saturday",
        dayOfWeek: 6,
        sessionType: "yoga",
        label: "Yoga class",
        isWeekend: true,
      },
    ],
  },
  {
    week: 2,
    phase: "Follicular",
    intent: "Build — progressive load, rising energy",
    days: [
      {
        day: "Sunday",
        dayOfWeek: 0,
        sessionType: "yoga",
        label: "Yoga class",
        isWeekend: true,
      },
      {
        day: "Monday",
        dayOfWeek: 1,
        sessionType: "physio",
        label: "Physio activation + core + light load",
        exercises: [
          "Stork drill (right first) — 3×10 ea",
          "Triple extension wall switches (right first) — 3×8 ea",
          "DB single-leg glute bridge (right first) — 3×10 ea",
          "DB goblet squat — 3×12",
          "Short foot exercise — 2×20s hold ea",
          "Dead bug / bird dog — 3×8 ea",
          "90/90 hip switches — 2 min",
        ],
      },
      {
        day: "Tuesday",
        dayOfWeek: 2,
        sessionType: "resistance",
        label: "Light resistance — sliders + bands",
        exercises: [
          "Slider lateral lunges (right first) — 3×8 ea",
          "Slider hamstring curls — 3×12",
          "Band pull-aparts — 3×15",
          "DB overhead press — 3×10",
          "Band pallof press — 2×10 ea side",
        ],
      },
      {
        day: "Wednesday",
        dayOfWeek: 3,
        sessionType: "pilates",
        label: "Pilates flow + ball",
        exercises: [
          "Mat Pilates flow — 18 min",
          "Ball between knees, bridges — 3×12",
          "Ball pass, supine leg to hand — 2×10",
          "Toe spread and splay — 2×15",
        ],
      },
      {
        day: "Thursday",
        dayOfWeek: 4,
        sessionType: "physio",
        label: "Physio activation + balance",
        exercises: [
          "Adductor work, per physio Rx (right first) — 3×10 ea",
          "Slider adductor slides (right first) — 3×8 ea",
          "Single-leg balance reach (right first) — 3×8 ea",
          "Calf raises, controlled tempo — 3×12",
          "Banded ankle inversion/eversion — 2×15 ea",
        ],
      },
      {
        day: "Friday",
        dayOfWeek: 5,
        sessionType: "run",
        label: "Easy run",
        exercises: [
          "20–25 min easy pace (~6:30–6:45/km)",
        ],
      },
      {
        day: "Saturday",
        dayOfWeek: 6,
        sessionType: "resistance",
        label: "Heavy lift — posterior chain / hinge",
        isWeekend: true,
      },
    ],
  },
  {
    week: 3,
    phase: "Ovulation → early luteal",
    intent: "Peak — max effort, PR window on lifts and runs",
    days: [
      {
        day: "Sunday",
        dayOfWeek: 0,
        sessionType: "yoga",
        label: "Yoga class",
        isWeekend: true,
      },
      {
        day: "Monday",
        dayOfWeek: 1,
        sessionType: "pilates",
        label: "Pilates flow + ball",
        exercises: [
          "Mat Pilates flow — 18 min",
          "Ball between knees, bridges — 3×12",
          "Ball pass, supine leg to hand — 2×10",
          "Toe spread and splay — 2×15",
        ],
      },
      {
        day: "Tuesday",
        dayOfWeek: 2,
        sessionType: "physio",
        label: "Physio activation + balance",
        exercises: [
          "Adductor work, per physio Rx (right first) — 3×10 ea",
          "Slider adductor slides (right first) — 3×8 ea",
          "Single-leg balance reach (right first) — 3×8 ea",
          "Calf raises, controlled tempo — 3×12",
          "Banded ankle inversion/eversion — 2×15 ea",
        ],
      },
      {
        day: "Wednesday",
        dayOfWeek: 3,
        sessionType: "physio",
        label: "Physio activation + core + light load",
        exercises: [
          "Stork drill (right first) — 3×10 ea",
          "Triple extension wall switches (right first) — 3×8 ea",
          "DB single-leg glute bridge (right first) — 3×10 ea",
          "DB goblet squat — 3×12",
          "Short foot exercise — 2×20s hold ea",
          "Dead bug / bird dog — 3×8 ea",
          "90/90 hip switches — 2 min",
        ],
      },
      {
        day: "Thursday",
        dayOfWeek: 4,
        sessionType: "resistance",
        label: "Light resistance — sliders + bands",
        exercises: [
          "Slider lateral lunges (right first) — 3×8 ea",
          "Slider hamstring curls — 3×12",
          "Band pull-aparts — 3×15",
          "DB overhead press — 3×10",
          "Band pallof press — 2×10 ea side",
        ],
      },
      {
        day: "Friday",
        dayOfWeek: 5,
        sessionType: "run",
        label: "Easy run + strides",
        exercises: [
          "20–30 min easy pace (~6:30–6:45/km)",
          "Optional 4–6×20s relaxed strides at the end",
        ],
        note: "Peak energy window — a good week to feel out slightly faster efforts if legs feel good",
      },
      {
        day: "Saturday",
        dayOfWeek: 6,
        sessionType: "resistance",
        label: "Heavy lift — posterior chain / hinge",
        isWeekend: true,
      },
    ],
  },
  {
    week: 4,
    phase: "Late luteal",
    intent: "Wind-down — maintain load, reduce intensity",
    weekNote: "Last week before the next deload — moderate the lift RPE and lean on the maintenance framing if low-output days show up.",
    days: [
      {
        day: "Sunday",
        dayOfWeek: 0,
        sessionType: "yoga",
        label: "Yoga class",
        isWeekend: true,
      },
      {
        day: "Monday",
        dayOfWeek: 1,
        sessionType: "physio",
        label: "Physio activation + balance",
        exercises: [
          "Adductor work, per physio Rx (right first) — 3×10 ea",
          "Single-leg balance reach (right first) — 3×8 ea",
          "Calf raises, controlled tempo — 3×12",
          "Banded ankle inversion/eversion — 2×15 ea",
        ],
        note: "Slider adductor slides swapped for band work — easing off eccentric load as luteal deepens",
      },
      {
        day: "Tuesday",
        dayOfWeek: 2,
        sessionType: "physio",
        label: "Physio activation + core + light load",
        exercises: [
          "Stork drill (right first) — 3×10 ea",
          "Triple extension wall switches (right first) — 3×8 ea",
          "DB single-leg glute bridge (right first) — 3×10 ea",
          "DB goblet squat — 3×12",
          "Short foot exercise — 2×20s hold ea",
          "Dead bug / bird dog — 3×8 ea",
        ],
      },
      {
        day: "Wednesday",
        dayOfWeek: 3,
        sessionType: "resistance",
        label: "Light resistance — bands, sliders light",
        exercises: [
          "Slider lateral lunges, reduced range (right first) — 2×8 ea",
          "Band pull-aparts — 3×15",
          "DB overhead press — 3×10",
          "Band pallof press — 2×10 ea side",
        ],
        note: "Sliders kept but volume trimmed — ease eccentric loading as period approaches",
      },
      {
        day: "Thursday",
        dayOfWeek: 4,
        sessionType: "pilates",
        label: "Pilates flow + ball",
        exercises: [
          "Mat Pilates flow — 18 min",
          "Ball between knees, bridges — 3×12",
          "Toe spread and splay — 2×15",
        ],
      },
      {
        day: "Friday",
        dayOfWeek: 5,
        sessionType: "run",
        label: "Easy run, pace buffer",
        exercises: [
          "20–25 min at a buffered easy pace (~7:00–7:15/km)",
        ],
        note: "Shorten or drop to a walk if fatigue or cramping shows up early",
      },
      {
        day: "Saturday",
        dayOfWeek: 6,
        sessionType: "resistance",
        label: "Heavy lift — moderate RPE",
        isWeekend: true,
      },
    ],
  },
];
