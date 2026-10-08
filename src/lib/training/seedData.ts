import type { TrainingPlan } from "@/types/training";

// 4-week cycle-synced block in TrainingPlan format, written to the
// training_plans table via upsertPlan rather than read from a static
// constant. currentWeek is a required DB field but is never trusted for
// display — the training page and ExerciseCard both derive the active week
// live from the real calendar date via getCycleBlockWeekInfo, so this plan
// stays correct even as the user's actual period date drifts from cycle to
// cycle. Week 1 (menstrual) and Week 4 (late luteal, the week right before
// the next period) intentionally share the same deload-level content.
export const cycleBlockPlan: TrainingPlan = {
  name: "4-Week Cycle Block",
  description: "Cycle-synced training anchored to period start — deload, build, peak, wind-down",
  totalWeeks: 4,
  currentWeek: 1,
  weeks: [
    {
      weekNumber: 1,
      phase: "Menstruation",
      intent: "Deload — recovery, not performance",
      weekNote:
        "This whole week is maintenance, not performance. Trim sets, drop to bodyweight, or swap a session for rest wherever your body's asking for it.",
      isDeload: true,
      sessions: [
        {
          dayOfWeek: 0,
          type: "yoga",
          label: "Yoga (restorative) or rest",
          isWeekend: true,
          isOptional: true,
        },
        {
          dayOfWeek: 1,
          type: "physio",
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
          dayOfWeek: 2,
          type: "resistance",
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
          dayOfWeek: 3,
          type: "pilates",
          label: "Pilates flow + ball",
          exercises: [
            "Mat Pilates flow — 18 min",
            "Ball between knees, bridges — 3×12",
            "Toe spread and splay — 2×15",
          ],
        },
        {
          dayOfWeek: 4,
          type: "physio",
          label: "Physio activation, low intensity",
          exercises: [
            "Ball squeeze adductor isometric — 3×15s hold",
            "Single-leg balance reach, gentle (right first) — 3×8 ea",
            "Calf raises, light — 2×12",
            "Banded ankle inversion/eversion — 2×15 ea",
          ],
        },
        {
          dayOfWeek: 5,
          type: "run",
          label: "Optional easy walk / very short jog",
          exercises: ["10–15 min easy walk, or an easy jog only if energy allows"],
          note: "Fully optional in days 1–3 of period — skip without guilt if fatigued",
          isOptional: true,
        },
        {
          dayOfWeek: 6,
          type: "yoga",
          label: "Yoga class",
          isWeekend: true,
        },
      ],
    },
    {
      weekNumber: 2,
      phase: "Follicular",
      intent: "Build — progressive load, rising energy",
      sessions: [
        {
          dayOfWeek: 0,
          type: "yoga",
          label: "Yoga class",
          isWeekend: true,
        },
        {
          dayOfWeek: 1,
          type: "physio",
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
          dayOfWeek: 2,
          type: "resistance",
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
          dayOfWeek: 3,
          type: "pilates",
          label: "Pilates flow + ball",
          exercises: [
            "Mat Pilates flow — 18 min",
            "Ball between knees, bridges — 3×12",
            "Ball pass, supine leg to hand — 2×10",
            "Toe spread and splay — 2×15",
          ],
        },
        {
          dayOfWeek: 4,
          type: "physio",
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
          dayOfWeek: 5,
          type: "run",
          label: "Easy run",
          exercises: ["20–25 min easy pace (~6:30–6:45/km)"],
          distanceKm: 3.5,
        },
        {
          dayOfWeek: 6,
          type: "heavy",
          label: "Heavy lift — posterior chain / hinge",
          isWeekend: true,
        },
      ],
    },
    {
      weekNumber: 3,
      phase: "Ovulation",
      intent: "Peak — max effort, PR window on lifts and runs",
      sessions: [
        {
          dayOfWeek: 0,
          type: "yoga",
          label: "Yoga class",
          isWeekend: true,
        },
        {
          dayOfWeek: 1,
          type: "pilates",
          label: "Pilates flow + ball",
          exercises: [
            "Mat Pilates flow — 18 min",
            "Ball between knees, bridges — 3×12",
            "Ball pass, supine leg to hand — 2×10",
            "Toe spread and splay — 2×15",
          ],
        },
        {
          dayOfWeek: 2,
          type: "physio",
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
          dayOfWeek: 3,
          type: "physio",
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
          dayOfWeek: 4,
          type: "resistance",
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
          dayOfWeek: 5,
          type: "run",
          label: "Easy run + strides",
          exercises: [
            "20–30 min easy pace (~6:30–6:45/km)",
            "Optional 4–6×20s relaxed strides at the end",
          ],
          note: "Peak energy window — a good week to feel out slightly faster efforts if legs feel good",
          distanceKm: 4,
        },
        {
          dayOfWeek: 6,
          type: "heavy",
          label: "Heavy lift — posterior chain / hinge",
          isWeekend: true,
        },
      ],
    },
    {
      weekNumber: 4,
      phase: "Late luteal",
      intent: "Deload — recovery, not performance",
      weekNote:
        "This whole week is maintenance, not performance. Trim sets, drop to bodyweight, or swap a session for rest wherever your body's asking for it.",
      isDeload: true,
      sessions: [
        {
          dayOfWeek: 0,
          type: "yoga",
          label: "Yoga (restorative) or rest",
          isWeekend: true,
          isOptional: true,
        },
        {
          dayOfWeek: 1,
          type: "physio",
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
          dayOfWeek: 2,
          type: "resistance",
          label: "Light resistance, bands only",
          exercises: [
            "Band pull-aparts — 3×15",
            "Band Romanian deadlift, controlled — 3×10",
            "Band lateral walks — 2×10 steps ea direction",
            "Band pallof press — 2×10 ea side",
          ],
          note: "Sliders skipped this week — no eccentric-heavy loading going into your period",
        },
        {
          dayOfWeek: 3,
          type: "pilates",
          label: "Pilates flow + ball",
          exercises: [
            "Mat Pilates flow — 18 min",
            "Ball between knees, bridges — 3×12",
            "Toe spread and splay — 2×15",
          ],
        },
        {
          dayOfWeek: 4,
          type: "physio",
          label: "Physio activation, low intensity",
          exercises: [
            "Ball squeeze adductor isometric — 3×15s hold",
            "Single-leg balance reach, gentle (right first) — 3×8 ea",
            "Calf raises, light — 2×12",
            "Banded ankle inversion/eversion — 2×15 ea",
          ],
        },
        {
          dayOfWeek: 5,
          type: "run",
          label: "Optional easy walk / very short jog",
          exercises: ["10–15 min easy walk, or an easy jog only if energy allows"],
          note: "Fully optional — skip without guilt if fatigued heading into your period",
          isOptional: true,
        },
        {
          dayOfWeek: 6,
          type: "yoga",
          label: "Yoga class",
          isWeekend: true,
        },
      ],
    },
  ],
};
