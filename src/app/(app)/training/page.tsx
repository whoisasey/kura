"use client";

import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import AISuggestionPanel from "@/components/training/AISuggestionPanel";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import Link from "next/link";
import SessionCard from "@/components/training/SessionCard";
import WeekCalendar from "@/components/training/WeekCalendar";
import { createClient } from "@/lib/supabase/client";
import { getActivePlan, upsertPlan } from "@/lib/training/trainingService";
import { runLongerPlan } from "@/lib/training/seedData";
import type { TrainingPlan, PlannedSession } from "@/types/training";
import type { CyclePhase } from "@/types/training";
import { useRouter } from "next/navigation";

const TrainingPage = () => {
  const router = useRouter();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [viewWeekIndex, setViewWeekIndex] = useState<number>(0);
  const [seeding, setSeeding] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [cyclePhase, setCyclePhase] = useState<CyclePhase | undefined>();
  const [cycleDay, setCycleDay] = useState<number | undefined>();

  const todayDow = new Date().getDay();
  const todayStr = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [activePlan, cycleRes] = await Promise.all([
        getActivePlan(supabase, user.id),
        supabase
          .from("cycle_entries")
          .select("phase, cycle_day")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (activePlan) {
        setPlan(activePlan);
        const currentIdx = activePlan.weeks.findIndex(w => w.weekNumber === activePlan.currentWeek);
        setViewWeekIndex(currentIdx >= 0 ? currentIdx : 0);
      } else {
        setPlan(null);
      }

      if (cycleRes.data) {
        setCyclePhase((cycleRes.data.phase as CyclePhase) ?? undefined);
        setCycleDay(cycleRes.data.cycle_day ?? undefined);
      }

      setLoading(false);
    };

    load();
  }, [router, todayStr, refresh]);

  const handleSeedPlan = async () => {
    setSeeding(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const raw = JSON.stringify(runLongerPlan, null, 2);
    await upsertPlan(supabase, user.id, runLongerPlan, raw, 'json');
    setSeeding(false);
    setRefresh(r => r + 1);
  };

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" minHeight="60vh">
        <CircularProgress />
      </Stack>
    );
  }

  if (!plan) {
    return (
      <Box p={3}>
        <Typography variant="h6" fontWeight={700} mb={1}>Training</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          No training plan found. Load your Run Longer plan or import a custom one.
        </Typography>
        <Stack gap={1.5}>
          <Button
            variant="contained"
            onClick={handleSeedPlan}
            disabled={seeding}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            {seeding ? "Loading…" : "Load Run Longer plan"}
          </Button>
          <Button
            component={Link}
            href="/training/import"
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Import custom plan
          </Button>
        </Stack>
      </Box>
    );
  }

  const currentWeek = plan.weeks[viewWeekIndex];
  const isCurrentWeek = currentWeek?.weekNumber === plan.currentWeek;
  const todaySession: PlannedSession | undefined = isCurrentWeek
    ? currentWeek?.sessions.find(s => s.dayOfWeek === todayDow)
    : undefined;
  const progressPct = (plan.currentWeek / plan.totalWeeks) * 100;

  const canGoPrev = viewWeekIndex > 0;
  const canGoNext = viewWeekIndex < plan.weeks.length - 1;

  return (
    <Box p={3} pb={4}>
      {/* Header */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={0.5}>
        <Typography variant="h6" fontWeight={700}>{plan.name}</Typography>
        <Stack direction="row" gap={0.5}>
          <Button
            size="small"
            onClick={handleSeedPlan}
            disabled={seeding}
            sx={{ textTransform: "none", fontSize: "0.75rem" }}
          >
            {seeding ? "Reloading…" : "Reload seed"}
          </Button>
          <Button
            component={Link}
            href="/training/import"
            size="small"
            sx={{ textTransform: "none", fontSize: "0.75rem" }}
          >
            Import
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
        <Typography variant="caption" color="text.secondary">
          Week {plan.currentWeek} of {plan.totalWeeks}
        </Typography>
        {currentWeek?.phase && (
          <Typography variant="caption" color="primary.main" fontWeight={600}>
            · {currentWeek.phase}
          </Typography>
        )}
        {currentWeek?.isDeload && (
          <Typography variant="caption" color="warning.main" fontWeight={600}>
            · Deload
          </Typography>
        )}
      </Stack>

      <LinearProgress
        variant="determinate"
        value={progressPct}
        sx={{ borderRadius: 4, height: 6, mb: 3 }}
      />

      {/* Today's Session */}
      {todaySession && (
        <Box mb={3}>
          <Typography variant="overline" color="text.secondary" display="block" mb={1}>
            Today
          </Typography>
          <SessionCard
            session={todaySession}
            isToday
            showAiButton
            onAiCheckIn={() => setShowAI(true)}
          />
          {showAI && (
            <Box mt={2}>
              <AISuggestionPanel
                session={todaySession}
                cyclePhase={cyclePhase}
                cycleDay={cycleDay}
              />
            </Box>
          )}
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Week selector */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <IconButton size="small" onClick={() => setViewWeekIndex(v => v - 1)} disabled={!canGoPrev}>
          <ArrowBackIosNewRoundedIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle2" fontWeight={600}>
          Week {currentWeek?.weekNumber}
          {currentWeek?.weeklyKm ? ` · ${currentWeek.weeklyKm} km` : ''}
          {isCurrentWeek ? ' (current)' : ''}
        </Typography>
        <IconButton size="small" onClick={() => setViewWeekIndex(v => v + 1)} disabled={!canGoNext}>
          <ArrowForwardIosRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* Week calendar strip */}
      {currentWeek && (
        <Box mb={3}>
          <WeekCalendar sessions={currentWeek.sessions} todayDow={isCurrentWeek ? todayDow : -1} />
        </Box>
      )}

      {/* Week session list */}
      {currentWeek && (
        <Stack gap={1.5}>
          {currentWeek.sessions
            .filter(s => s.type !== 'rest')
            .map(s => (
              <SessionCard
                key={s.dayOfWeek}
                session={s}
                isToday={isCurrentWeek && s.dayOfWeek === todayDow}
              />
            ))}
        </Stack>
      )}
    </Box>
  );
};

export default TrainingPage;
