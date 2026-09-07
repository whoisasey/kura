"use client";

import { Box, Stack } from "@mui/material";
import type { Cycle, CycleInsight } from "@/types/index";
import { getLast6Cycles, getLatestCycle } from "@/lib/supabase/queries/cycles";
import { useCallback, useEffect, useState } from "react";

import dynamic from "next/dynamic";
import KuraLogo from "@/components/ui/KuraLogo";
import { Skeleton } from "@mui/material";
import PhaseHeader from "@/components/cycle/PhaseHeader";
import CycleCalendar from "@/components/cycle/CycleCalendar";
import { computePredictedNextPeriod } from "@/lib/cycle/phaseCalculator";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Below-the-fold cards: lazy-loaded so they don't block initial paint
const HormoneCard = dynamic(() => import("@/components/cycle/HormoneCard"));
const SymptomForecastCard = dynamic(() => import("@/components/cycle/SymptomForecastCard"));
const ExerciseCard = dynamic(() => import("@/components/cycle/ExerciseCard"));
const TransitionCard = dynamic(() => import("@/components/cycle/TransitionCard"));
const LogPeriodFab = dynamic(() => import("@/components/cycle/LogPeriodFab"));

const CyclePage = () => {
  const router = useRouter();
  const [refresh, setRefresh] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);
  const [insightLoading, setInsightLoading] = useState(true);
  const [insight, setInsight] = useState<CycleInsight | null>(null);
  const [latestCycle, setLatestCycle] = useState<Cycle | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [predictedNextPeriod, setPredictedNextPeriod] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);

  const handleRefresh = useCallback(() => setRefresh((n) => n + 1), []);

  useEffect(() => {
    const supabase = createClient();

    const loadCalendar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [cycle, last6] = await Promise.all([
        getLatestCycle(supabase, user.id),
        getLast6Cycles(supabase, user.id),
      ]);

      setLatestCycle(cycle);
      setCycles(last6);
      setPredictedNextPeriod(computePredictedNextPeriod(last6.map((c) => c.period_start)));
    };

    const loadInsight = async () => {
      setInsightLoading(true);
      const localDate = new Date().toLocaleDateString("en-CA");
      const insightRes = await fetch(`/api/cycle-insight?date=${localDate}`, { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => ({ error: "fetch_failed" }));

      if (insightRes.noData) {
        setNoData(true);
        setInsight(null);
      } else if (!insightRes.error) {
        setNoData(false);
        setInsight(insightRes as CycleInsight);
      }
      setInsightLoading(false);
    };

    // Fire both in parallel — calendar data resolves faster than the AI insight
    Promise.all([loadCalendar(), loadInsight()]).finally(() => setInitialLoad(false));
  }, [refresh, router]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setRefresh((n) => n + 1);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  if (initialLoad) {
    return (
      <Box sx={{ position: "relative", px: 2, pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Skeleton variant="text" width={160} height={48} />
        <Skeleton variant="text" width={100} height={24} />
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={160} />
        <Skeleton variant="rounded" height={120} />
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <KuraLogo />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2, pb: 4, position: "relative" }}>
      <Stack spacing={2} sx={{ pt: 2 }}>
        <PhaseHeader insight={insight} loading={insightLoading} predictedNextPeriod={predictedNextPeriod} />
        <CycleCalendar latestCycle={latestCycle} cycles={cycles} />
        {!noData && (
          <>
            <HormoneCard insight={insight} loading={insightLoading} />
            <SymptomForecastCard insight={insight} loading={insightLoading} />
            <ExerciseCard insight={insight} loading={insightLoading} />
            <TransitionCard insight={insight} loading={insightLoading} />
          </>
        )}
      </Stack>
      <LogPeriodFab activeCycle={latestCycle} onLogged={handleRefresh} />
    </Box>
  );
};

export default CyclePage;
