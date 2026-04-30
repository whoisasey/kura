"use client";

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { Cycle, FlowIntensity } from "@/types/index";
import { insertCycle, updateCycleEnd } from "@/lib/supabase/queries/cycles";

import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface LogPeriodFabProps {
  activeCycle: Cycle | null;
  onLogged: () => void;
}

const todayStr = () => new Date().toLocaleDateString("en-CA");

const SYMPTOMS = [
  "cramps",
  "bloating",
  "headache",
  "acne",
  "fatigue",
  "breast_tenderness",
  "joint_pain",
  "other",
] as const;

// Day 0 = pre-period (before bleeding starts)
const SYMPTOM_DAYS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

type DayEntry = { symptoms: Set<string>; flow: FlowIntensity | null };
type DayLog = Record<number, DayEntry>;

const emptyDay = (): DayEntry => ({ symptoms: new Set(), flow: null });

const parseNotes = (notes: string | null): DayLog => {
  if (!notes) return {};
  try {
    const parsed = JSON.parse(notes) as Array<{ day: number; symptoms: string[]; flow?: FlowIntensity }>;
    return Object.fromEntries(
      parsed.map(({ day, symptoms, flow }) => [day, { symptoms: new Set(symptoms), flow: flow ?? null }])
    );
  } catch {
    // legacy comma-separated format
    return { 1: { symptoms: new Set(notes.split(", ").filter(Boolean)), flow: null } };
  }
};

const serializeNotes = (log: DayLog): string | null => {
  const entries = Object.entries(log)
    .map(([day, { symptoms, flow }]) => ({
      day: Number(day),
      symptoms: Array.from(symptoms),
      ...(flow ? { flow } : {}),
    }))
    .filter((e) => e.symptoms.length > 0 || e.flow)
    .sort((a, b) => a.day - b.day);
  return entries.length > 0 ? JSON.stringify(entries) : null;
};

const LogPeriodFab = ({ activeCycle, onLogged }: LogPeriodFabProps) => {
  const [open, setOpen] = useState(false);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [dayLog, setDayLog] = useState<DayLog>({});
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setPeriodStart(activeCycle?.period_start ?? todayStr());
    setPeriodEnd(activeCycle?.period_end ?? "");
    const parsed = parseNotes(activeCycle?.notes ?? null);
    // Seed day 1 flow from cycles.flow_intensity if notes don't have it yet
    if (activeCycle?.flow_intensity && !parsed[1]?.flow) {
      parsed[1] = { ...(parsed[1] ?? emptyDay()), flow: activeCycle.flow_intensity };
    }
    setDayLog(parsed);
    setSelectedDay(1);
    setError(null);
    setOpen(true);
  };

  const toggleSymptom = (symptom: string) => {
    setDayLog((prev) => {
      const entry = { ...(prev[selectedDay] ?? emptyDay()) };
      const next = new Set(entry.symptoms);
      if (next.has(symptom)) next.delete(symptom);
      else next.add(symptom);
      return { ...prev, [selectedDay]: { ...entry, symptoms: next } };
    });
  };

  const setDayFlow = (flow: FlowIntensity | null) => {
    setDayLog((prev) => ({
      ...prev,
      [selectedDay]: { ...(prev[selectedDay] ?? emptyDay()), flow },
    }));
  };

  const handleConfirm = async () => {
    if (!periodStart) {
      setError("Period start date is required.");
      return;
    }
    if (periodEnd && periodEnd < periodStart) {
      setError("End date must be on or after the start date.");
      return;
    }

    setSaving(true);
    setError(null);

    const notesValue = serializeNotes(dayLog);
    const day1Flow = dayLog[1]?.flow ?? null;

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (activeCycle) {
        if (periodEnd && !activeCycle.period_end) {
          await updateCycleEnd(supabase, activeCycle.id, periodEnd);
        }
        const updates: Record<string, string | null> = { notes: notesValue, period_start: periodStart };
        if (day1Flow) updates.flow_intensity = day1Flow;
        if (periodEnd) updates.period_end = periodEnd;
        await supabase.from("cycles").update(updates).eq("id", activeCycle.id);
      } else {
        await insertCycle(supabase, {
          user_id: user.id,
          period_start: periodStart,
          ...(periodEnd ? { period_end: periodEnd } : {}),
          ...(day1Flow ? { flow_intensity: day1Flow } : {}),
          ...(notesValue ? { notes: notesValue } : {}),
        });
      }

      setOpen(false);
      onLogged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const currentEntry = dayLog[selectedDay] ?? emptyDay();

  return (
    <>
      <Fab
        color="primary"
        onClick={handleOpen}
        sx={{ position: "fixed", bottom: "calc(72px + env(safe-area-inset-bottom))", right: 16, zIndex: 50 }}
        aria-label="Log period"
      >
        <CalendarTodayRoundedIcon />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Log period</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField
              type="date"
              label="Period start"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              label="Period end"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <TextField
            select
            label="Day"
            value={selectedDay}
            onChange={(e) => setSelectedDay(Number(e.target.value))}
            size="small"
            fullWidth
          >
            {SYMPTOM_DAYS.map((d) => (
              <MenuItem key={d} value={d}>
                {d === 0 ? "Day 0 — pre-period" : `Day ${d}`}
              </MenuItem>
            ))}
          </TextField>

          <ToggleButtonGroup
            value={currentEntry.flow}
            exclusive
            onChange={(_, val) => setDayFlow(val as FlowIntensity | null)}
            size="small"
            fullWidth
          >
            <ToggleButton value="light">Light</ToggleButton>
            <ToggleButton value="medium">Medium</ToggleButton>
            <ToggleButton value="heavy">Heavy</ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {SYMPTOMS.map((s) => {
              const active = currentEntry.symptoms.has(s);
              return (
                <Chip
                  key={s}
                  label={s.replace("_", " ")}
                  onClick={() => toggleSymptom(s)}
                  variant={active ? "filled" : "outlined"}
                  color={active ? "warning" : "default"}
                  size="small"
                />
              );
            })}
          </Box>

          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleConfirm} disabled={saving || !periodStart}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LogPeriodFab;
