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
  LinearProgress,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material";
import type { PlannedSession, TrainingPlan } from "@/types/training";
import { getActivePlan, upsertPlan } from "@/lib/training/trainingService";
import {
  getCycleBlockWeek,
  getDaysUntilNextPhase,
  getNextPhaseName,
  getPhaseTransitionMessage,
} from "@/lib/training/getCycleBlockWeek";
import { useEffect, useState } from "react";

import AISuggestionPanel from "@/components/training/AISuggestionPanel";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import type { BlockDay } from "@/lib/training/cycleBlock";
import { CYCLE_BLOCK } from "@/lib/training/cycleBlock";
import type { CyclePhase } from "@/types/training";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Link from "next/link";
import SessionCard from "@/components/training/SessionCard";
import WeekCalendar from "@/components/training/WeekCalendar";
import { computeCycleDay } from "@/lib/cycle/phaseCalculator";
import { createClient } from "@/lib/supabase/client";
import { cycleBlockPlan } from "@/lib/training/seedData";
import { formatWeekRange } from "@/lib/training/formatWeekRange";
import { useRouter } from "next/navigation";

const BLOCK_SESSION_COLORS: Record<string, string> = {
  physio: "success.main",
  resistance: "secondary.main",
  pilates: "warning.dark",
  run: "primary.main",
  yoga: "success.light",
  rest: "text.disabled",
};

// Inline card for a BlockDay — richer than SessionCard since it shows exercises
const BlockDayCard = ({ blockDay, isToday }: { blockDay: BlockDay; isToday: boolean }) => {
  const [open, setOpen] = useState(isToday);
  const dotColor = BLOCK_SESSION_COLORS[blockDay.sessionType] ?? "text.secondary";

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
          <Box
            sx={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              bgcolor: dotColor,
              flexShrink: 0,
            }}
          />
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
                <Typography variant="caption" color="text.disabled">
                  optional
                </Typography>
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

      {blockDay.exercises?.length ? (
        <Collapse in={open}>
          <Box px={2} pb={1.5} pt={0}>
            <List dense disablePadding sx={{ "& .MuiListItem-root": { px: 0, py: 0.25 } }}>
              {blockDay.exercises.map((ex, i) => (
                <ListItem key={i}>
                  <Typography variant="caption" color="text.secondary">
                    · {ex}
                  </Typography>
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
    </Box>
  );
};

const TrainingPage = () => {
  const router = useRouter();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [viewWeekIndex, setViewWeekIndex] = useState<number>(0);
  const [seeding, setSeeding] = useState(false);
  const [selectedSession, setSelectedSession] = useState<PlannedSession | null>(null);
  const [cyclePhase, setCyclePhase] = useState<CyclePhase | undefined>();
  const [cycleDay, setCycleDay] = useState<number | undefined>();

  const todayDow = new Date().getDay();
  const todayStr = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const [activePlan, cycleRes] = await Promise.all([
        getActivePlan(supabase, user.id),
        supabase
          .from("cycles")
          .select("phase, period_start")
          .eq("user_id", user.id)
          .order("period_start", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (activePlan) {
        setPlan(activePlan);
        const currentIdx = activePlan.weeks.findIndex((w) => w.weekNumber === activePlan.currentWeek);
        setViewWeekIndex(currentIdx >= 0 ? currentIdx : 0);
      } else {
        setPlan(null);
      }

      if (cycleRes.data) {
        setCyclePhase((cycleRes.data.phase as CyclePhase) ?? undefined);
        const derived = computeCycleDay(cycleRes.data.period_start);
        setCycleDay(derived > 0 ? derived : undefined);
      }

      setLoading(false);
    };

    load();
  }, [router, todayStr, refresh]);

  const handleSeedPlan = async () => {
    setSeeding(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const raw = JSON.stringify(cycleBlockPlan, null, 2);
    await upsertPlan(supabase, user.id, cycleBlockPlan, raw, "json");
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

  // Derive cycle block week from cycleDay
  const blockWeekNum = cycleDay != null ? getCycleBlockWeek(cycleDay) : null;
  const blockWeekData = blockWeekNum != null ? CYCLE_BLOCK[blockWeekNum - 1] : null;
  const transitionMsg = cycleDay != null ? getPhaseTransitionMessage(cycleDay) : null;
  const daysUntilNext = cycleDay != null ? getDaysUntilNextPhase(cycleDay) : null;
  const nextPhase = cycleDay != null ? getNextPhaseName(cycleDay) : null;
  const todayCycleDay = blockWeekData?.days.find((d) => d.dayOfWeek === todayDow) ?? null;

  return (
    <Box p={3} pb={4}>
      <Typography variant="h6" fontWeight={700} mb={2}>
        Training
      </Typography>

      {/* ── Cycle Block Section ── */}
      {blockWeekData && (
        <Box mb={4}>
          {/* Week banner */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
            <Typography variant="subtitle1" fontWeight={700}>
              Week {blockWeekData.week} — {blockWeekData.phase}
            </Typography>
            {blockWeekNum === 3 && <Chip label="PR window" size="small" color="warning" sx={{ fontSize: "0.7rem" }} />}
          </Stack>

          <Typography variant="body2" color="text.secondary" mb={0.5}>
            {blockWeekData.intent}
          </Typography>

          <Typography variant="caption" color="text.disabled">
            Cycle day {cycleDay}
            {daysUntilNext != null && daysUntilNext > 0 && (
              <>
                {" "}
                · {daysUntilNext} day{daysUntilNext !== 1 ? "s" : ""} until {nextPhase}
              </>
            )}
          </Typography>

          {transitionMsg && (
            <Alert severity="info" sx={{ mt: 1.5, mb: 2, borderRadius: 2, fontSize: "0.85rem" }}>
              {transitionMsg}
            </Alert>
          )}

          {blockWeekData.weekNote && !transitionMsg && (
            <Typography variant="caption" color="text.disabled" display="block" mt={1} mb={1.5} fontStyle="italic">
              {blockWeekData.weekNote}
            </Typography>
          )}

          {/* Today's session highlighted */}
          {todayCycleDay && (
            <Box mb={2} mt={transitionMsg ? 0 : 1.5}>
              <Typography variant="overline" color="text.secondary" display="block" mb={1}>
                Today
              </Typography>
              <BlockDayCard blockDay={todayCycleDay} isToday />
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />

          {/* Full week schedule */}
          <Typography variant="overline" color="text.secondary" display="block" mb={1}>
            This week
          </Typography>
          <Stack gap={1}>
            {blockWeekData.days.map((day) => (
              <BlockDayCard key={day.dayOfWeek} blockDay={day} isToday={day.dayOfWeek === todayDow} />
            ))}
          </Stack>
        </Box>
      )}

      {/* ── Plan Section ── */}
      {!blockWeekData && !plan && (
        <Box>
          <Typography variant="body2" color="text.secondary" mb={3}>
            No training plan found. Load the cycle block plan or import a custom one.
          </Typography>
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
        </Box>
      )}

      {plan && (
        <>
          {blockWeekData && (
            <Typography variant="overline" color="text.secondary" display="block" mb={2}>
              Training plan
            </Typography>
          )}

          {/* Plan header */}
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={0.5}>
            <Typography variant="subtitle1" fontWeight={700}>
              {plan.name}
            </Typography>
            <Stack direction="row" gap={0.5}>
              <Button
                size="small"
                onClick={handleSeedPlan}
                disabled={seeding}
                sx={{ textTransform: "none", fontSize: "0.75rem" }}
              >
                {seeding ? "Reloading…" : "Reload"}
              </Button>
              <Button
                component={Link}
                href="/training/edit"
                size="small"
                sx={{ textTransform: "none", fontSize: "0.75rem" }}
              >
                Edit
              </Button>
            </Stack>
          </Stack>

          {(() => {
            const currentWeek = plan.weeks[viewWeekIndex];
            const isCurrentWeek = currentWeek?.weekNumber === plan.currentWeek;
            const todaySession: PlannedSession | undefined = isCurrentWeek
              ? currentWeek?.sessions.find((s) => s.dayOfWeek === todayDow)
              : undefined;
            const progressPct = (plan.currentWeek / plan.totalWeeks) * 100;
            const canGoPrev = viewWeekIndex > 0;
            const canGoNext = viewWeekIndex < plan.weeks.length - 1;

            return (
              <>
                <Stack direction="row" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
                  <Typography variant="caption" color="text.secondary">
                    Week {plan.currentWeek} of {plan.totalWeeks}
                  </Typography>
                  {currentWeek?.weekStartDate && (
                    <Typography variant="caption" color="text.secondary">
                      · {formatWeekRange(currentWeek.weekStartDate)}
                    </Typography>
                  )}
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

                <LinearProgress variant="determinate" value={progressPct} sx={{ borderRadius: 4, height: 6, mb: 3 }} />

                {todaySession && (
                  <Box mb={3}>
                    <Typography variant="overline" color="text.secondary" display="block" mb={1}>
                      Today
                    </Typography>
                    <SessionCard
                      session={todaySession}
                      isToday
                      showAiButton
                      isSelected={selectedSession?.dayOfWeek === todaySession.dayOfWeek}
                      onAiCheckIn={() =>
                        setSelectedSession((s) => (s?.dayOfWeek === todaySession.dayOfWeek ? null : todaySession))
                      }
                      onClick={() =>
                        setSelectedSession((s) => (s?.dayOfWeek === todaySession.dayOfWeek ? null : todaySession))
                      }
                    />
                    {selectedSession?.dayOfWeek === todaySession.dayOfWeek && (
                      <AISuggestionPanel
                        key={todaySession.dayOfWeek}
                        session={todaySession}
                        cyclePhase={cyclePhase}
                        cycleDay={cycleDay}
                      />
                    )}
                  </Box>
                )}

                <Divider sx={{ mb: 3 }} />

                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setViewWeekIndex((v) => v - 1);
                      setSelectedSession(null);
                    }}
                    disabled={!canGoPrev}
                  >
                    <ArrowBackIosNewRoundedIcon fontSize="small" />
                  </IconButton>
                  <Box textAlign="center">
                    <Typography variant="subtitle2" fontWeight={600}>
                      Week {currentWeek?.weekNumber}
                      {currentWeek?.weeklyKm ? ` · ${currentWeek.weeklyKm} km` : ""}
                      {isCurrentWeek ? " (current)" : ""}
                    </Typography>
                    {currentWeek?.weekStartDate && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatWeekRange(currentWeek.weekStartDate)}
                      </Typography>
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setViewWeekIndex((v) => v + 1);
                      setSelectedSession(null);
                    }}
                    disabled={!canGoNext}
                  >
                    <ArrowForwardIosRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>

                {currentWeek && (
                  <Box mb={3}>
                    <WeekCalendar
                      sessions={currentWeek.sessions}
                      todayDow={isCurrentWeek ? todayDow : -1}
                      selectedDow={selectedSession?.dayOfWeek}
                      onSelectDay={(dow) => {
                        const s = currentWeek.sessions.find((s) => s.dayOfWeek === dow) ?? null;
                        setSelectedSession((prev) => (prev?.dayOfWeek === dow ? null : s));
                      }}
                    />
                  </Box>
                )}

                {currentWeek && (
                  <Stack gap={1.5}>
                    {currentWeek.sessions
                      .filter((s) => s.type !== "rest")
                      .map((s) => {
                        const isSelected = selectedSession?.dayOfWeek === s.dayOfWeek;
                        return (
                          <Box key={s.dayOfWeek}>
                            <SessionCard
                              session={s}
                              isToday={isCurrentWeek && s.dayOfWeek === todayDow}
                              isSelected={isSelected}
                              onClick={() => setSelectedSession(isSelected ? null : s)}
                            />
                            {isSelected && (
                              <AISuggestionPanel
                                key={s.dayOfWeek}
                                session={s}
                                cyclePhase={cyclePhase}
                                cycleDay={cycleDay}
                              />
                            )}
                          </Box>
                        );
                      })}
                  </Stack>
                )}
              </>
            );
          })()}
        </>
      )}
    </Box>
  );
};

export default TrainingPage;
