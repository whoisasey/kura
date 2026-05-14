"use client";

import { Box, Stack } from "@mui/material";
import type { Cycle, CycleInsight } from "@/types/index";
import { getLast6Cycles, getLatestCycle } from "@/lib/supabase/queries/cycles";
import { useCallback, useEffect, useState } from "react";

import CycleCalendar from "@/components/cycle/CycleCalendar";
import ExerciseCard from "@/components/cycle/ExerciseCard";
import HormoneCard from "@/components/cycle/HormoneCard";
import KuraLogo from "@/components/ui/KuraLogo";
import LogPeriodFab from "@/components/cycle/LogPeriodFab";
import PhaseHeader from "@/components/cycle/PhaseHeader";
import SymptomForecastCard from "@/components/cycle/SymptomForecastCard";
import TransitionCard from "@/components/cycle/TransitionCard";
import { computePredictedNextPeriod } from "@/lib/cycle/phaseCalculator";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const CyclePage = () => {
  const router = useRouter();
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<CycleInsight | null>(null);
  const [latestCycle, setLatestCycle] = useState<Cycle | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [predictedNextPeriod, setPredictedNextPeriod] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);

  const handleRefresh = useCallback(() => setRefresh((n) => n + 1), []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const localDate = new Date().toLocaleDateString("en-CA");
        const [insightRes, cycle, last6] = await Promise.all([
          fetch(`/api/cycle-insight?date=${localDate}`, { cache: "no-store" })
            .then((r) => r.json())
            .catch(() => ({ error: "fetch_failed" })),
          getLatestCycle(supabase, user.id),
          getLast6Cycles(supabase, user.id),
        ]);

        if (insightRes.noData) {
          setNoData(true);
          setInsight(null);
        } else if (!insightRes.error) {
          setNoData(false);
          setInsight(insightRes as CycleInsight);
        }

        setLatestCycle(cycle);
        setCycles(last6);
        setPredictedNextPeriod(computePredictedNextPeriod(last6.map((c) => c.period_start)));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [refresh, router]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setRefresh((n) => n + 1);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return (
    <Box sx={{ px: 2, pb: 4, position: "relative" }}>
      {loading && (
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
      )}
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
  );
};

export default CyclePage;
