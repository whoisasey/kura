"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { PlannedSession, SessionType, TrainingPlan, TrainingWeek } from "@/types/training";
import { SortableContext, rectSwappingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { getActivePlan, upsertPlan } from "@/lib/training/trainingService";
import { useEffect, useState } from "react";

import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { CSS } from "@dnd-kit/utilities";
import DragHandleRoundedIcon from "@mui/icons-material/DragHandleRounded";
import { createClient } from "@/lib/supabase/client";
import { formatWeekRange } from "@/lib/training/formatWeekRange";
import { useRouter } from "next/navigation";

// Display order Sun → Sat (matches WeekCalendar)
const DISPLAY_DOW = [0, 1, 2, 3, 4, 5, 6];
const DOW_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SESSION_TYPES: SessionType[] = ["run", "tempo", "heavy", "yoga", "unilateral", "physio", "resistance", "pilates", "rest"];
const TYPE_COLOR: Record<SessionType, "primary" | "warning" | "secondary" | "info" | "default" | "success"> = {
  run: "primary",
  tempo: "warning",
  heavy: "secondary",
  unilateral: "info",
  yoga: "success",
  physio: "success",
  resistance: "secondary",
  pilates: "warning",
  rest: "default",
};

type Slot = { id: string; session: PlannedSession | null };

const makeSlots = (week: TrainingWeek): Slot[] =>
  DISPLAY_DOW.map((dow, i) => ({
    id: `slot-${i}`,
    session: week.sessions.find((s) => s.dayOfWeek === dow) ?? null,
  }));

// Re-assign dayOfWeek based on slot position after drag reorder
const getSessions = (slots: Slot[]): PlannedSession[] =>
  slots.flatMap(({ session }, i) => {
    if (!session || session.type === "rest") return [];
    return [{ ...session, dayOfWeek: DISPLAY_DOW[i] }];
  });

// ── SortableSlot ─────────────────────────────────────────────────────────────

// weekStartDate is Sunday; displayIdx 0=Sun … 6=Sat, so offset is just displayIdx
const slotDate = (weekStartDate: string | undefined, displayIdx: number): string | null => {
  if (!weekStartDate) return null;
  const start = new Date(`${weekStartDate}T00:00:00`);
  start.setDate(start.getDate() + displayIdx);
  return start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

type SortableSlotProps = {
  slot: Slot;
  displayIdx: number;
  weekStartDate?: string;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<PlannedSession>) => void;
};

const SortableSlot = ({ slot, displayIdx, weekStartDate, isExpanded, onToggle, onUpdate }: SortableSlotProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slot.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const session = slot.session;
  const type = session?.type ?? "rest";
  const isRest = !session || type === "rest";

  return (
    <Box ref={setNodeRef} style={style}>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          borderColor: isExpanded ? "primary.main" : "divider",
          transition: "border-color 0.15s",
        }}
      >
        {/* Row */}
        <Stack direction="row" alignItems="center" gap={1} px={1} py={1.25}>
          <IconButton
            size="small"
            {...attributes}
            {...listeners}
            sx={{ cursor: "grab", touchAction: "none", color: "text.disabled", p: 0.5 }}
          >
            <DragHandleRoundedIcon fontSize="small" />
          </IconButton>

          <Box sx={{ flexShrink: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
              {DOW_LABEL[DISPLAY_DOW[displayIdx]]}
            </Typography>
            {slotDate(weekStartDate, displayIdx) && (
              <Typography variant="caption" color="text.disabled" display="block" sx={{ fontSize: "0.6rem" }}>
                {slotDate(weekStartDate, displayIdx)}
              </Typography>
            )}
          </Box>

          {isRest ? (
            <Typography variant="body2" color="text.disabled" flex={1}>
              Rest
            </Typography>
          ) : (
            <>
              <Chip
                label={type}
                size="small"
                color={TYPE_COLOR[type]}
                sx={{ fontSize: "0.65rem", height: 20, flexShrink: 0 }}
              />
              <Typography variant="body2" flex={1} noWrap>
                {session?.label}
              </Typography>
              {session?.distanceKm != null && (
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                  {session.distanceKm} km
                </Typography>
              )}
            </>
          )}

          <Button
            size="small"
            onClick={onToggle}
            sx={{ minWidth: 0, textTransform: "none", fontSize: "0.7rem", px: 1, flexShrink: 0 }}
          >
            {isExpanded ? "Done" : "Edit"}
          </Button>
        </Stack>

        {/* Inline edit form */}
        {isExpanded && (
          <Box px={2} pb={2} pt={0.5}>
            <Divider sx={{ mb: 1.5 }} />
            <Stack gap={1.5}>
              <Stack direction="row" gap={1} alignItems="center">
                <Typography variant="caption" color="text.secondary" sx={{ width: 56, flexShrink: 0 }}>
                  Type
                </Typography>
                <Select
                  size="small"
                  value={type}
                  onChange={(e) => {
                    const t = e.target.value as SessionType;
                    onUpdate(
                      t === "rest"
                        ? { type: "rest", label: "Rest", sub: undefined, distanceKm: undefined }
                        : { type: t }
                    );
                  }}
                  sx={{ fontSize: "0.8rem", flex: 1 }}
                >
                  {SESSION_TYPES.map((t) => (
                    <MenuItem key={t} value={t} sx={{ fontSize: "0.8rem" }}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>

              {!isRest && (
                <>
                  <Stack direction="row" gap={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ width: 56, flexShrink: 0 }}>
                      Label
                    </Typography>
                    <TextField
                      size="small"
                      value={session?.label ?? ""}
                      onChange={(e) => onUpdate({ label: e.target.value })}
                      sx={{ flex: 1 }}
                      inputProps={{ style: { fontSize: "0.8rem" } }}
                    />
                  </Stack>

                  <Stack direction="row" gap={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ width: 56, flexShrink: 0 }}>
                      Sub
                    </Typography>
                    <TextField
                      size="small"
                      value={session?.sub ?? ""}
                      onChange={(e) => onUpdate({ sub: e.target.value || undefined })}
                      placeholder="optional"
                      sx={{ flex: 1 }}
                      inputProps={{ style: { fontSize: "0.8rem" } }}
                    />
                  </Stack>

                  <Stack direction="row" gap={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ width: 56, flexShrink: 0 }}>
                      km
                    </Typography>
                    <TextField
                      size="small"
                      type="number"
                      value={session?.distanceKm ?? ""}
                      onChange={(e) => onUpdate({ distanceKm: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="optional"
                      sx={{ flex: 1 }}
                      inputProps={{ style: { fontSize: "0.8rem" }, min: 0, step: 0.5 }}
                    />
                  </Stack>
                </>
              )}
            </Stack>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

// ── EditPlanPage ──────────────────────────────────────────────────────────────

const EditPlanPage = () => {
  const router = useRouter();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [planName, setPlanName] = useState("");
  const [editedWeeks, setEditedWeeks] = useState<TrainingWeek[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [viewWeekIndex, setViewWeekIndex] = useState(0);
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const activePlan = await getActivePlan(supabase, user.id);
      if (!activePlan) {
        router.push("/training");
        return;
      }

      setPlan(activePlan);
      setPlanName(activePlan.name);
      const weeks = activePlan.weeks.map((w) => ({ ...w, sessions: [...w.sessions] }));
      setEditedWeeks(weeks);

      const startIdx = weeks.findIndex((w) => w.weekNumber === activePlan.currentWeek);
      const idx = startIdx >= 0 ? startIdx : 0;
      setViewWeekIndex(idx);
      setSlots(makeSlots(weeks[idx]));
      setLoading(false);
    };
    load();
  }, [router]);

  // Navigate weeks — editedWeeks is always current since drag/edit sync immediately
  const goToWeek = (newIdx: number) => {
    setSlots(makeSlots(editedWeeks[newIdx]));
    setExpandedSlotId(null);
    setViewWeekIndex(newIdx);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIdx = slots.findIndex((s) => s.id === active.id);
    const newIdx = slots.findIndex((s) => s.id === over.id);
    const newSlots = [...slots];
    [newSlots[oldIdx], newSlots[newIdx]] = [newSlots[newIdx], newSlots[oldIdx]];
    setSlots(newSlots);
    setEditedWeeks((prev) => {
      const updated = [...prev];
      updated[viewWeekIndex] = { ...updated[viewWeekIndex], sessions: getSessions(newSlots) };
      return updated;
    });
  };

  // This is a controlled update pattern — slots and editedWeeks are kept in sync on every change
  const updateSlot = (slotId: string, updates: Partial<PlannedSession>) => {
    const newSlots = slots.map((s) => {
      if (s.id !== slotId) return s;
      const base: PlannedSession = s.session ?? { dayOfWeek: 0, type: "run", label: "" };
      return { ...s, session: { ...base, ...updates } };
    });
    setSlots(newSlots);
    setEditedWeeks((prev) => {
      const updated = [...prev];
      updated[viewWeekIndex] = { ...updated[viewWeekIndex], sessions: getSessions(newSlots) };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const finalPlan: TrainingPlan = { ...plan, name: planName, weeks: editedWeeks };
      const result = await upsertPlan(supabase, user.id, finalPlan, JSON.stringify(finalPlan, null, 2), "json");
      if (result) {
        setSaved(true);
      } else {
        console.error("upsertPlan returned null — likely a Supabase RLS or schema error");
        setSaveError(true);
      }
    } catch (err) {
      console.error("handleSave threw:", err);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" minHeight="60vh">
        <CircularProgress />
      </Stack>
    );
  }

  if (!plan) return null;

  const currentWeek = editedWeeks[viewWeekIndex];
  const canGoPrev = viewWeekIndex > 0;
  const canGoNext = viewWeekIndex < editedWeeks.length - 1;

  return (
    <Box p={3} pb={22}>
      {/* Header */}
      <Stack direction="row" alignItems="center" gap={1} mb={2.5}>
        <IconButton size="small" onClick={() => router.push("/training")} sx={{ ml: -0.5 }}>
          <ArrowBackRoundedIcon fontSize="small" />
        </IconButton>
        <Typography variant="h6" fontWeight={700}>
          Edit Plan
        </Typography>
      </Stack>

      {/* Plan name */}
      <TextField
        label="Plan name"
        value={planName}
        onChange={(e) => setPlanName(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 3 }}
        inputProps={{ style: { fontSize: "0.875rem" } }}
      />

      {/* Week navigation */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
        <IconButton size="small" onClick={() => goToWeek(viewWeekIndex - 1)} disabled={!canGoPrev}>
          <ArrowBackIosNewRoundedIcon fontSize="small" />
        </IconButton>

        <Box textAlign="center">
          <Typography variant="subtitle2" fontWeight={600}>
            Week {currentWeek?.weekNumber}
            {currentWeek?.weeklyKm ? ` · ${currentWeek.weeklyKm} km` : ""}
          </Typography>
          {currentWeek?.weekStartDate && (
            <Typography variant="caption" color="text.secondary" display="block">
              {formatWeekRange(currentWeek.weekStartDate)}
            </Typography>
          )}
          {currentWeek?.phase && (
            <Typography variant="caption" color="primary.main" fontWeight={600} display="block">
              {currentWeek.phase}
              {currentWeek.isDeload ? " · Deload" : ""}
            </Typography>
          )}
        </Box>

        <IconButton size="small" onClick={() => goToWeek(viewWeekIndex + 1)} disabled={!canGoNext}>
          <ArrowForwardIosRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Divider sx={{ mb: 2.5, mt: 1 }} />

      {/* Draggable day slots */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slots.map((s) => s.id)} strategy={rectSwappingStrategy}>
          <Stack gap={1}>
            {slots.map((slot, i) => (
              <SortableSlot
                key={slot.id}
                slot={slot}
                displayIdx={i}
                weekStartDate={currentWeek?.weekStartDate}
                isExpanded={expandedSlotId === slot.id}
                onToggle={() => setExpandedSlotId((prev) => (prev === slot.id ? null : slot.id))}
                onUpdate={(updates) => updateSlot(slot.id, updates)}
              />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>

      <Snackbar
        open={saved}
        autoHideDuration={2500}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          setSaved(false);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" sx={{ width: "100%" }}>
          Plan saved successfully
        </Alert>
      </Snackbar>

      <Snackbar
        open={saveError}
        autoHideDuration={3000}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          setSaveError(false);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" variant="filled" sx={{ width: "100%" }}>
          Failed to save — please try again
        </Alert>
      </Snackbar>

      {/* Sticky save bar — sits above the 56px BottomNavigation */}
      <Box
        sx={{
          position: "fixed",
          bottom: "calc(56px + env(safe-area-inset-bottom))",
          left: 0,
          right: 0,
          zIndex: 200,
          p: 2,
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Button
          variant="contained"
          fullWidth
          onClick={handleSave}
          disabled={saving}
          sx={{ borderRadius: 2, textTransform: "none", py: 1.25 }}
        >
          {saving ? "Saving…" : "Save plan"}
        </Button>
      </Box>
    </Box>
  );
};

export default EditPlanPage;
