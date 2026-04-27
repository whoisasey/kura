'use client'

import { useCallback, useEffect, useState } from 'react'
import { Box, Stack } from '@mui/material'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getLatestCycle, getLast6Cycles } from '@/lib/supabase/queries/cycles'
import { computePredictedNextPeriod } from '@/lib/cycle/phaseCalculator'
import PhaseHeader from '@/components/cycle/PhaseHeader'
import CycleCalendar from '@/components/cycle/CycleCalendar'
import HormoneCard from '@/components/cycle/HormoneCard'
import ExerciseCard from '@/components/cycle/ExerciseCard'
import TransitionCard from '@/components/cycle/TransitionCard'
import SymptomForecastCard from '@/components/cycle/SymptomForecastCard'
import LogPeriodFab from '@/components/cycle/LogPeriodFab'
import type { Cycle, CycleInsight } from '@/types/index'

const CyclePage = () => {
  const router = useRouter()
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState<CycleInsight | null>(null)
  const [latestCycle, setLatestCycle] = useState<Cycle | null>(null)
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [predictedNextPeriod, setPredictedNextPeriod] = useState<string | null>(null)
  const [noData, setNoData] = useState(false)

  const handleRefresh = useCallback(() => setRefresh((n) => n + 1), [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [insightRes, cycle, last6] = await Promise.all([
        fetch('/api/cycle-insight').then((r) => r.json()),
        getLatestCycle(supabase, user.id),
        getLast6Cycles(supabase, user.id),
      ])

      if (insightRes.noData) {
        setNoData(true)
        setInsight(null)
      } else if (!insightRes.error) {
        setNoData(false)
        setInsight(insightRes as CycleInsight)
      }

      setLatestCycle(cycle)
      setCycles(last6)
      setPredictedNextPeriod(
        computePredictedNextPeriod(last6.map((c) => c.period_start))
      )
      setLoading(false)
    }

    load()
  }, [refresh, router])

  return (
    <Box sx={{ px: 2, pb: 4 }}>
      <Stack spacing={2} sx={{ pt: 2 }}>
        <PhaseHeader insight={insight} loading={loading} predictedNextPeriod={predictedNextPeriod} />
        <CycleCalendar latestCycle={latestCycle} cycles={cycles} />
        {!noData && (
          <>
            <HormoneCard insight={insight} loading={loading} />
            <SymptomForecastCard insight={insight} loading={loading} />
            <ExerciseCard insight={insight} loading={loading} />
            <TransitionCard insight={insight} loading={loading} />
          </>
        )}
      </Stack>
      <LogPeriodFab activeCycle={latestCycle} onLogged={handleRefresh} />
    </Box>
  )
}

export default CyclePage
