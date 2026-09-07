"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material";
import type { PlannedSession, TrainingPlan } from "@/types/training";
import { getActivePlan, upsertPlan } from "@/lib/training/trainingService";
import { getAvgCycleLength } from "@/lib/supabase/queries/cycles";
import {
  getCycleBlockWeek,
  getDaysUntilNextPhase,
  getNextPhaseName,
  getPhaseTransitionMessage,
  isPrePeriodDeload,
} from "@/lib/training/getCycleBlockWeek";
import { useEffect, useState } from "react";

import AISuggestionPanel from "@/components/training/AISuggestionPanel";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import type { BlockDay } from "@/lib/training/cycleBlock";
import { CYCLE_BLOCK } from "@/lib/training/cycleBlock";
import SessionOutcomeLogger from "@/components/training/SessionOutcomeLogger";
import type { CyclePhase } from "@/types/training";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Link from "next/link";
import { computeCycleDay } from "@/lib/cycle/phaseCalculator";
import { createClient } from "@/lib/supabase/client";
import { cycleBlockPlan } from "@/lib/training/seedData";
import { useRouter } from "next/navigation";

const BLOCK_SESSION_COLORS: Record<string, string> = {
  physio: "success.main",
  resistance: "secondary.main",
  pilates: "warning.dark",
  run: "primary.main",
  yoga: "success.light",
  rest: "text.disabled",
};

interface BlockDayCardProps {
  blockDay: BlockDay;
  isToday: boolean;
  cyclePhase?: CyclePhase;
  cycleDay?: number;
  showLogger?: boolean;
  blockWeek?: number;
}

const BlockDayCard = ({ blockDay, isToday, cyclePhase, cycleDay, showLogger, blockWeek }: BlockDayCardProps) => {
  const [open, setOpen] = useState(isToday);
  const [showAi, setShowAi] = useState(false);
  const dotColor = BLOCK_SESSION_COLORS[blockDay.sessionType] ?? "text.secondary";

  // Minimal PlannedSession shape for AISuggestionPanel
  const asSession: PlannedSession = {
    dayOfWeek: blockDay.dayOfWeek,
    type: blockDay.sessionType as PlannedSession["type"],
    label: blockDay.label,
    sub: blockDay.exercises?.slice(0, 3).join(" · "),
  };

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: "1.5px solid",
        borderColor: isToday ? dotColor : "divider",
        bgcolor: isToday ? "action.hover" : "background.paper",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        px={2}
        py={1.5}
        onClick={() => blockDay.exercises?.length && setOpen((o) => !o)}
        sx={{ cursor: blockDay.exercises?.length ? "pointer" : "default" }}
      >
        <Stack direction="row" alignItems="center" gap={1.25}>
          <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: dotColor, flexShrink: 0 }} />
          <Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="subtitle2" fontWeight={600}>
                {blockDay.day}
              </Typography>
              {isToday && (
                <Chip
                  label="Today"
                  size="small"
                  sx={{ fontSize: "0.65rem", height: 18, bgcolor: dotColor, color: "background.paper" }}
                />
              )}
              {blockDay.isOptional && (
                <Typography variant="caption" color="text.disabled">optional</Typography>
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {blockDay.label}
            </Typography>
          </Box>
        </Stack>

        {blockDay.exercises?.length ? (
          <ExpandMoreRoundedIcon
            fontSize="small"
            sx={{
              color: "text.disabled",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        ) : null}
      </Stack>

      {isToday && (
        <Box px={2} pb={1.5}>
          <Stack direction="row" gap={1}>
            <Button
              size="small"
              variant={showAi ? "contained" : "outlined"}
              onClick={() => setShowAi((v) => !v)}
              sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.8rem" }}
            >
              AI suggest
            </Button>
          </Stack>
          {showAi && (
            <Box mt={1}>
              <AISuggestionPanel session={asSession} cyclePhase={cyclePhase} cycleDay={cycleDay} />
            </Box>
          )}
        </Box>
      )}

      {blockDay.exercises?.length ? (
        <Collapse in={open}>
          <Box px={2} pb={1.5} pt={0}>
            <List dense disablePadding sx={{ "& .MuiListItem-root": { px: 0, py: 0.25 } }}>
              {blockDay.exercises.map((ex, i) => (
                <ListItem key={i}>
                  <Typography variant="caption" color="text.secondary">· {ex}</Typography>
                </ListItem>
              ))}
            </List>
            {blockDay.note && (
              <Typography variant="caption" color="text.disabled" display="block" mt={0.5} fontStyle="italic">
                {blockDay.note}
              </Typography>
            )}
          </Box>
        </Collapse>
      ) : null}

      {showLogger && cycleDay != null && blockWeek != null && (
        <SessionOutcomeLogger
          blockDay={blockDay}
          cycleDay={cycleDay}
          blockWeek={blockWeek}
        />
      )}
    </Box>
  );
};

const TrainingPage = () => {
  const router = useRouter();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [seeding, setSeeding] = useState(false);
  const [cyclePhase, setCyclePhase] = useState<CyclePhase | undefined>();
  const [cycleDay, setCycleDay] = useState<number | undefined>();
  const [avgCycleLength, setAvgCycleLength] = useState(29);
  const [viewWeek, setViewWeek] = useState<1 | 2 | 3 | 4>(1);

  const todayDow = new Date().getDay();
  const todayStr = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [activePlan, cycleRes, avgLen] = await Promise.all([
        getActivePlan(supabase, user.id),
        supabase
          .from("cycles")
          .select("phase, period_start")
          .eq("user_id", user.id)
          .order("period_start", { ascending: false })
          .limit(1)
          .maybeSingle(),
        getAvgCycleLength(supabase, user.id),
      ]);

      setPlan(activePlan);

      setAvgCycleLength(avgLen);

      if (cycleRes.data) {
        setCyclePhase((cycleRes.data.phase as CyclePhase) ?? undefined);
        const derived = computeCycleDay(cycleRes.data.period_start);
        if (derived > 0) {
          setCycleDay(derived);
          setViewWeek(getCycleBlockWeek(derived, avgLen));
        }
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
    await upsertPlan(supabase, user.id, cycleBlockPlan, JSON.stringify(cycleBlockPlan, null, 2), "json");
    setSeeding(false);
    setRefresh((r) => r + 1);
  };

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" minHeight="60vh">
        <CircularProgress />
      </Stack>
    );
  }

  const blockWeekNum = cycleDay != null ? getCycleBlockWeek(cycleDay, avgCycleLength) : null;
  const blockWeekData = blockWeekNum != null ? CYCLE_BLOCK[blockWeekNum - 1] : null;
  const transitionMsg = cycleDay != null ? getPhaseTransitionMessage(cycleDay, avgCycleLength) : null;
  const daysUntilNext = cycleDay != null ? getDaysUntilNextPhase(cycleDay, avgCycleLength) : null;
  const nextPhase = cycleDay != null ? getNextPhaseName(cycleDay, avgCycleLength) : null;
  const prePeriod = cycleDay != null && isPrePeriodDeload(cycleDay, avgCycleLength) && cycleDay > 7;

  // The week being viewed (may differ from current block week)
  const viewWeekData = CYCLE_BLOCK[viewWeek - 1];
  const isViewingCurrentWeek = viewWeek === blockWeekNum;

  // No cycle data at all — show empty state
  if (!blockWeekData) {
    return (
      <Box p={3}>
        <Typography variant="h6" fontWeight={700} mb={1}>Training</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Log your period start to see your cycle-synced training block.
        </Typography>
        {!plan && (
          <Stack gap={1.5}>
            <Button
              variant="contained"
              onClick={handleSeedPlan}
              disabled={seeding}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              {seeding ? "Loading…" : "Load cycle block plan"}
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
        )}
      </Box>
    );
  }

  return (
    <Box p={3} pb={4}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700}>Training</Typography>
        <Stack direction="row" gap={0.5}>
          <Button
            size="small"
            onClick={handleSeedPlan}
            disabled={seeding}
            sx={{ textTransform: "none", fontSize: "0.75rem", color: "text.secondary" }}
          >
            {seeding ? "Reloading…" : "Reload"}
          </Button>
          <Button
            component={Link}
            href="/training/edit"
            size="small"
            sx={{ textTransform: "none", fontSize: "0.75rem", color: "text.secondary" }}
          >
            Edit
          </Button>
        </Stack>
      </Stack>

      {/* Week navigator */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
        <IconButton
          size="small"
          onClick={() => setViewWeek((w) => Math.max(1, w - 1) as 1 | 2 | 3 | 4)}
          disabled={viewWeek === 1}
        >
          <ArrowBackIosNewRoundedIcon fontSize="small" />
        </IconButton>

        <Box textAlign="center" flex={1}>
          <Stack direction="row" alignItems="center" justifyContent="center" gap={1}>
            <Typography variant="subtitle1" fontWeight={700}>
              Week {viewWeekData.week} — {isViewingCurrentWeek && prePeriod ? "Late luteal · pre-period deload" : viewWeekData.phase}
            </Typography>
            {viewWeek === 3 && (
              <Chip label="PR window" size="small" color="warning" sx={{ fontSize: "0.7rem" }} />
            )}
          </Stack>
          {!isViewingCurrentWeek && blockWeekNum && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => setViewWeek(blockWeekNum)}
            >
              Back to current (Week {blockWeekNum})
            </Typography>
          )}
        </Box>

        <IconButton
          size="small"
          onClick={() => setViewWeek((w) => Math.min(4, w + 1) as 1 | 2 | 3 | 4)}
          disabled={viewWeek === 4}
        >
          <ArrowForwardIosRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Typography variant="body2" color="text.secondary" mb={0.5} textAlign="center">
        {viewWeekData.intent}
      </Typography>

      {isViewingCurrentWeek && (
        <Typography variant="caption" color="text.disabled" display="block" textAlign="center">
          Cycle day {cycleDay}
          {daysUntilNext != null && daysUntilNext > 0 && (
            <> · {daysUntilNext} day{daysUntilNext !== 1 ? "s" : ""} until {nextPhase}</>
          )}
        </Typography>
      )}

      {/* Week progress dots */}
      <Stack direction="row" gap={0.75} mt={1.25} mb={2} justifyContent="center">
        {([1, 2, 3, 4] as const).map((w) => (
          <Box
            key={w}
            onClick={() => setViewWeek(w)}
            sx={{
              width: w === viewWeek ? 20 : 8,
              height: 8,
              borderRadius: 4,
              bgcolor: w === blockWeekNum
                ? "primary.main"
                : w === viewWeek
                ? "action.active"
                : w < (blockWeekNum ?? 0)
                ? "primary.light"
                : "divider",
              transition: "width 0.2s",
              cursor: "pointer",
            }}
          />
        ))}
      </Stack>

      {isViewingCurrentWeek && transitionMsg && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2, fontSize: "0.85rem" }}>
          {transitionMsg}
        </Alert>
      )}

      {viewWeekData.weekNote && !(isViewingCurrentWeek && transitionMsg) && (
        <Typography variant="caption" color="text.disabled" display="block" mb={2} fontStyle="italic">
          {viewWeekData.weekNote}
        </Typography>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* Single unified week list */}
      <Stack gap={1}>
        {viewWeekData.days.map((day) => (
          <BlockDayCard
            key={day.dayOfWeek}
            blockDay={day}
            isToday={isViewingCurrentWeek && day.dayOfWeek === todayDow}
            cyclePhase={cyclePhase}
            cycleDay={cycleDay}
            showLogger={viewWeek === 1 && isViewingCurrentWeek && day.dayOfWeek === todayDow}
            blockWeek={viewWeek}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default TrainingPage;
