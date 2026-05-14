'use client'

import { Box, Card, CardContent, Chip, Divider, Skeleton, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import type { CycleInsight } from '@/types/index'
import type { CyclePhase } from '@/lib/cycle/phaseCalculator'
import type { PlannedSession, SessionType } from '@/types/training'
import { runLongerPlan } from '@/lib/training/seedData'

interface ExerciseCardProps {
  insight: CycleInsight | null
  loading: boolean
}

// Phase note per session type — connects training plan to cycle awareness
const phaseNote: Record<CyclePhase, Partial<Record<SessionType, string>>> = {
  follicular: {
    heavy:      'Rising estrogen supports muscle protein synthesis and connective tissue repair — this is a genuine strength window. Add 5–10% to your working sets if it feels available; your neuromuscular coordination is high.',
    run:        'Your aerobic system responds well to stimulus during follicular phase — this is base-building that actually sticks. Keep it truly conversational so the adaptation lands without digging into recovery.',
    tempo:      'Pain tolerance is elevated and mood is high — follicular phase is one of the better windows for tempo work. Hit your target pace confidently; your body is primed to handle intensity right now.',
    unilateral: 'Proprioception and coordination are heightened as estrogen rises — you will feel the mind-muscle connection more clearly. Good session to really focus on right glute activation and hip extension quality.',
    rest:       'Follicular rest days restore without cost — your recovery rate is faster now than at any other phase. Use it as a true recharge rather than a missed session.',
  },
  ovulation: {
    heavy:      'Testosterone and estrogen are both peaking — this is your highest strength potential of the month. Worth going for a working max if the session allows, but keep form tight: ligament laxity also peaks at ovulation.',
    run:        'VO2 max and pain tolerance are at their highest right now. If any day is a good day to push the pace, this is it — just warm up well, as oestrogen-driven ligament laxity increases joint injury risk.',
    tempo:      'Peak window for tempo effort — your body can sustain race pace more comfortably now than at any other point in your cycle. Use this session as a true tempo indicator of current fitness.',
    unilateral: 'Power output and coordination are both high at ovulation. This is a good session to add load or reps to the physio work — your single-leg stability and glute recruitment will feel sharp.',
    rest:       'Your recovery window at ovulation is short — you will likely feel ready to go again quickly. Use the rest day for quality sleep and fuelling rather than complete inactivity if energy is high.',
  },
  luteal: {
    heavy:      'Progesterone raises your core temperature and increases perceived effort for the same output — what feels hard genuinely is harder. Pull back 10–15% on load and treat this as a quality-over-numbers session.',
    run:        'Progesterone raises your resting heart rate by 1–3 bpm, so the same pace will feel harder and show a higher HR than usual. Run by RPE rather than pace today — slower splits at the same effort are completely normal.',
    tempo:      'Replace pace targets with "comfortably hard" effort — pushing through luteal tempo at prescribed pace increases injury risk and cortisol load. A controlled hard effort still builds fitness without the cost.',
    unilateral: 'Reduce load slightly and focus on activation quality over reps or resistance. The right glute and hip extension work responds well to lower-load, higher-attention reps — luteal phase is not the time to push unilateral volume.',
    rest:       'Progesterone suppresses immune function and elevates cortisol in late luteal phase — rest days here are physiologically essential, not optional. This is one of the most important rest days of your cycle.',
  },
  menstrual: {
    heavy:      'If you lift today, work well below your normal load — focus on the movement pattern, bracing, and breath rather than output. Hip hinge and posterior chain work tends to feel more tolerable than pressing during menstruation.',
    run:        'Prostaglandins drive inflammation and cramping — higher intensity can amplify both. A 20–30 min walk or very easy jog is fine if you feel up to it; if you are fatigued or in pain, rest is the training today.',
    tempo:      'This is the wrong week for tempo — glycogen storage is lower, the inflammatory response is high, and your body is completing its monthly reset. Swap for an easy walk or rest and come back to tempo work in follicular.',
    unilateral: 'Light unilateral work at 50–60% of your normal load is fine if you feel okay. The physio activation work can actually ease lower back and glute tension during menstruation — keep it short and low-effort.',
    rest:       'Your body is completing its monthly hormonal reset and shedding the uterine lining — this is the most physiologically justified rest day of your entire cycle. Full rest today is not falling behind.',
  },
}

const getSessionForDow = (dow: number): PlannedSession | undefined => {
  const week = runLongerPlan.weeks.find(w => w.weekNumber === runLongerPlan.currentWeek)
  return week?.sessions.find(s => s.dayOfWeek === dow)
}

interface PlannedSessionDisplayProps {
  session: PlannedSession
  phase: CyclePhase
  label: string
  aiNote?: string | null
  noteLoading?: boolean
}

const PlannedSessionDisplay = ({ session, phase, label, aiNote, noteLoading }: PlannedSessionDisplayProps) => {
  const fallback = phaseNote[phase]?.[session.type]
  const displayNote = aiNote ?? fallback

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="caption" color="text.disabled" fontWeight={500} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>

      <Typography variant="h3" color="primary.main" fontWeight={700}>
        {session.label}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip label={session.type} size="small" sx={{ textTransform: 'capitalize', bgcolor: 'background.default' }} />
        {session.distanceKm && (
          <Chip label={`${session.distanceKm} km`} size="small" sx={{ bgcolor: 'background.default' }} />
        )}
        {session.durationMin && (
          <Chip label={`${session.durationMin} min`} size="small" sx={{ bgcolor: 'background.default' }} />
        )}
      </Box>

      {session.sub && (
        <Typography variant="body2" color="text.secondary">{session.sub}</Typography>
      )}

      {noteLoading && <Skeleton variant="text" width="100%" height={20} />}

      {!noteLoading && displayNote && (
        <Typography variant="body2" color="text.secondary">
          {displayNote}
        </Typography>
      )}
    </Box>
  )
}

const ExerciseCard = ({ insight, loading }: ExerciseCardProps) => {
  const todayDow    = new Date().getDay()
  const tomorrowDow = (todayDow + 1) % 7

  const todaySession    = getSessionForDow(todayDow)
  const tomorrowSession = getSessionForDow(tomorrowDow)

  const [aiNote, setAiNote]       = useState<string | null>(null)
  const [noteLoading, setNoteLoading] = useState(false)

  useEffect(() => {
    if (!insight || !todaySession || todaySession.type === 'rest') return

    const fetchNote = async () => {
      setNoteLoading(true)
      try {
        const params = new URLSearchParams({
          phase: insight.phase,
          cycleDay: String(insight.cycle_day),
          dow: String(todayDow),
        })
        const res = await fetch(`/api/training/exercise-note?${params}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json() as { note: string | null }
        if (data.note) setAiNote(data.note)
      } finally {
        setNoteLoading(false)
      }
    }

    fetchNote()
  }, [insight?.phase, insight?.cycle_day, todayDow]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Movement
        </Typography>

        {loading && (
          <>
            <Skeleton variant="text" width="50%" height={32} />
            <Skeleton variant="rounded" width="100%" height={32} />
            <Skeleton variant="text" width="90%" height={20} />
          </>
        )}

        {!loading && !insight && (
          <Typography variant="body2" color="text.disabled">
            Log your first period to get movement recommendations.
          </Typography>
        )}

        {!loading && insight && (
          <>
            {todaySession ? (
              <PlannedSessionDisplay session={todaySession} phase={insight.phase} label="Today" aiNote={aiNote} noteLoading={noteLoading} />
            ) : (
              <>
                <Typography variant="caption" color="text.disabled" fontWeight={500} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Today
                </Typography>
                <Typography variant="h3" color="primary.main" fontWeight={700}>
                  {insight.exercise.recommended_type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {insight.exercise.rationale}
                </Typography>
              </>
            )}

            {tomorrowSession && (
              <>
                <Divider sx={{ my: 0.5 }} />
                <PlannedSessionDisplay session={tomorrowSession} phase={insight.phase} label="Tomorrow" />
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ExerciseCard
