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
import type { PlannedSession, TrainingPlan, TrainingWeek } from "@/types/training";
import { getActivePlan, upsertPlan } from "@/lib/training/trainingService";
import { getAvgCycleLength } from "@/lib/supabase/queries/cycles";
import { getBlockTransitionMessage, getCycleBlockWeekInfo } from "@/lib/training/getCycleBlockWeek";
import { useEffect, useState } from "react";

import AISuggestionPanel from "@/components/training/AISuggestionPanel";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import SessionOutcomeLogger from "@/components/training/SessionOutcomeLogger";
import type { CyclePhase } from "@/types/training";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Link from "next/link";
import { computeCycleDay, daysUntilNextPhase, getNextPhaseLabel } from "@/lib/cycle/phaseCalculator";
import { createClient } from "@/lib/supabase/client";
import { cycleBlockPlan } from "@/lib/training/seedData";
import { formatWeekRange } from "@/lib/training/formatWeekRange";
import { useRouter } from "next/navigation";

const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type PastOutcome = {
  status: "completed" | "modified" | "skipped";
  note: string | null;
  streak: number; // consecutive cycles with the same status
};
type PastPatterns = Record<number, PastOutcome>; // keyed by dayOfWeek

const patternMsg = (p: PastOutcome): string | null => {
  if (p.status === "completed") return null; // expected, not worth surfacing
  const prefix = p.streak >= 2 ? `Last ${p.streak} cycles` : "Last cycle";
  if (p.status === "skipped") return `${prefix}: skipped`;
  if (p.status === "modified") return p.note ? `${prefix}: ${p.note}` : `${prefix}: modified`;
  return null;
};

const BLOCK_SESSION_COLORS: Record<string, string> = {
  physio: "success.main",
  resistance: "secondary.main",
  pilates: "warning.dark",
  run: "primary.main",
  yoga: "success.light",
  heavy: "secondary.dark",
  tempo: "warning.main",
  unilateral: "info.main",
  rest: "text.disabled",
};

interface BlockDayCardProps {
  session: PlannedSession;
  isToday: boolean;
  cyclePhase?: CyclePhase;
  cycleDay?: number;
  showLogger?: boolean;
  blockWeek?: number;
  pastPattern?: PastOutcome;
}

const BlockDayCard = ({ session, isToday, cyclePhase, cycleDay, showLogger, blockWeek, pastPattern }: BlockDayCardProps) => {
  const [open, setOpen] = useState(isToday);
  const [showAi, setShowAi] = useState(false);
  const dotColor = BLOCK_SESSION_COLORS[session.type] ?? "text.secondary";
  const dayName = DOW_NAMES[session.dayOfWeek];

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
        onClick={() => session.exercises?.length && setOpen((o) => !o)}
        sx={{ cursor: session.exercises?.length ? "pointer" : "default" }}
      >
        <Stack direction="row" alignItems="center" gap={1.25}>
          <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: dotColor, flexShrink: 0 }} />
          <Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="subtitle2" fontWeight={600}>
                {dayName}
              </Typography>
              {isToday && (
                <Chip
                  label="Today"
                  size="small"
                  sx={{ fontSize: "0.65rem", height: 18, bgcolor: dotColor, color: "background.paper" }}
                />
              )}
              {session.isOptional && (
                <Typography variant="caption" color="text.disabled">optional</Typography>
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {session.label}
            </Typography>
          </Box>
        </Stack>

        {session.exercises?.length ? (
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
              <AISuggestionPanel session={session} cyclePhase={cyclePhase} cycleDay={cycleDay} />
            </Box>
          )}
        </Box>
      )}

      {session.exercises?.length ? (
        <Collapse in={open}>
          <Box px={2} pb={1.5} pt={0}>
            <List dense disablePadding sx={{ "& .MuiListItem-root": { px: 0, py: 0.25 } }}>
              {session.exercises.map((ex, i) => (
                <ListItem key={i}>
                  <Typography variant="caption" color="text.secondary">· {ex}</Typography>
                </ListItem>
              ))}
            </List>
            {session.note && (
              <Typography variant="caption" color="text.disabled" display="block" mt={0.5} fontStyle="italic">
                {session.note}
              </Typography>
            )}
          </Box>
        </Collapse>
      ) : null}

      {pastPattern && patternMsg(pastPattern) && (
        <Typography
          variant="caption"
          color="text.disabled"
          display="block"
          px={2}
          pb={showLogger ? 0 : 1.5}
          fontStyle="italic"
        >
          {patternMsg(pastPattern)}
        </Typography>
      )}

      {showLogger && cycleDay != null && blockWeek != null && (
        <SessionOutcomeLogger
          session={session}
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
  const [periodStart, setPeriodStart] = useState<string | undefined>();
  const [avgCycleLength, setAvgCycleLength] = useState(28);
  const [viewWeek, setViewWeek] = useState<1 | 2 | 3 | 4>(1);
  const [pastPatterns, setPastPatterns] = useState<PastPatterns>({});

  const todayDow = new Date().getDay();
  const todayStr = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [activePlan, cycleRes, avgLen, pastLogsRes] = await Promise.all([
        getActivePlan(supabase, user.id),
        supabase
          .from("cycles")
          .select("phase, period_start")
          .eq("user_id", user.id)
          .order("period_start", { ascending: false })
          .limit(1)
          .maybeSingle(),
        getAvgCycleLength(supabase, user.id),
        supabase
          .from("workout_sessions")
          .select("day_of_week, status, completion_notes, scheduled_date")
          .eq("user_id", user.id)
          .in("week_number", [1, 4]) // both deload weeks share the same content
          .order("scheduled_date", { ascending: false })
          .limit(28), // 4 cycles × 7 days
      ]);

      setPlan(activePlan);
      setAvgCycleLength(avgLen);

      // Group past deload-week logs by day_of_week, compute pattern per day
      if (pastLogsRes.data?.length) {
        const byDay: Record<number, Array<{ status: string; note: string | null }>> = {};
        for (const row of pastLogsRes.data) {
          if (!byDay[row.day_of_week]) byDay[row.day_of_week] = [];
          byDay[row.day_of_week].push({ status: row.status, note: row.completion_notes });
        }
        const computed: PastPatterns = {};
        for (const [dow, logs] of Object.entries(byDay)) {
          const recent = logs[0];
          let streak = 0;
          for (const l of logs) {
            if (l.status === recent.status) streak++;
            else break;
          }
          computed[Number(dow)] = {
            status: recent.status as PastOutcome["status"],
            note: recent.note,
            streak,
          };
        }
        setPastPatterns(computed);
      }

      if (cycleRes.data) {
        setCyclePhase((cycleRes.data.phase as CyclePhase) ?? undefined);
        setPeriodStart(cycleRes.data.period_start);
        const derived = computeCycleDay(cycleRes.data.period_start);
        if (derived > 0) {
          setCycleDay(derived);
          setViewWeek(getCycleBlockWeekInfo(cycleRes.data.period_start, avgLen, todayStr).weekNumber);
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

  const weekByNumber = (n: number): TrainingWeek | undefined => plan?.weeks.find((w) => w.weekNumber === n);

  const blockWeekInfo = cycleDay != null && periodStart ? getCycleBlockWeekInfo(periodStart, avgCycleLength, todayStr) : null;
  const blockWeekNum = blockWeekInfo?.weekNumber ?? null;
  const transitionMsg = cycleDay != null && blockWeekInfo ? getBlockTransitionMessage(cycleDay, blockWeekInfo, todayStr) : null;
  const daysUntilNext = cycleDay != null ? daysUntilNextPhase(cycleDay, avgCycleLength) : null;
  const nextPhase = cycleDay != null ? getNextPhaseLabel(cycleDay) : null;

  // The week being viewed (may differ from current block week) — always read
  // live from the DB-backed plan, never from a static constant, so edits
  // made on /training/edit show up here immediately.
  const viewWeekData = weekByNumber(viewWeek);
  const isViewingCurrentWeek = viewWeek === blockWeekNum;

  // No plan loaded, or no cycle logged yet — show empty state
  if (!plan || !viewWeekData) {
    return (
      <Box p={3}>
        <Typography variant="h6" fontWeight={700} mb={1}>Training</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          {cycleDay == null
            ? "Log your period start to see your cycle-synced training block."
            : "Load your cycle-synced training block to get started."}
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
              Week {viewWeekData.weekNumber} — {viewWeekData.phase}
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
          {blockWeekInfo && `${formatWeekRange(blockWeekInfo.weekStartDate)} · `}
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
        {viewWeekData.sessions.map((session) => (
          <BlockDayCard
            key={session.dayOfWeek}
            session={session}
            isToday={isViewingCurrentWeek && session.dayOfWeek === todayDow}
            cyclePhase={cyclePhase}
            cycleDay={cycleDay}
            showLogger={!!viewWeekData.isDeload && isViewingCurrentWeek && session.dayOfWeek === todayDow}
            blockWeek={viewWeek}
            pastPattern={viewWeekData.isDeload ? pastPatterns[session.dayOfWeek] : undefined}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default TrainingPage;
