"use client";

import { Box, Button, CircularProgress, Divider, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import { createClient } from "@/lib/supabase/client";
import type { BlockDay } from "@/lib/training/cycleBlock";

type OutcomeStatus = "completed" | "modified" | "skipped";

interface SessionOutcomeLoggerProps {
  blockDay: BlockDay;
  cycleDay: number;
  blockWeek: number;
}

const STATUS_META: Record<OutcomeStatus, { label: string; color: string }> = {
  completed: { label: "Did it",   color: "success.main" },
  modified:  { label: "Modified", color: "warning.main" },
  skipped:   { label: "Skipped",  color: "text.disabled" },
};

const SessionOutcomeLogger = ({ blockDay, cycleDay, blockWeek }: SessionOutcomeLoggerProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [status, setStatus] = useState<OutcomeStatus | null>(null);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);

  const today = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("workout_sessions")
        .select("id, status, completion_notes")
        .eq("user_id", user.id)
        .eq("scheduled_date", today)
        .eq("day_of_week", blockDay.dayOfWeek)
        .maybeSingle();

      if (data) {
        setExistingId(data.id);
        setStatus(data.status as OutcomeStatus);
        setNote(data.completion_notes ?? "");
      }

      setLoading(false);
    };
    load();
  }, [today, blockDay.dayOfWeek]);

  const handleSave = async (selectedStatus: OutcomeStatus) => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = {
      user_id: user.id,
      week_number: blockWeek,
      day_of_week: blockDay.dayOfWeek,
      session_type: blockDay.sessionType,
      scheduled_date: today,
      completed_at: selectedStatus !== "skipped" ? new Date().toISOString() : null,
      status: selectedStatus,
      completion_notes: selectedStatus === "modified" ? note.trim() || null : null,
      cycle_day: cycleDay,
    };

    if (existingId) {
      await supabase.from("workout_sessions").update(payload).eq("id", existingId);
    } else {
      const { data } = await supabase.from("workout_sessions").insert(payload).select("id").single();
      if (data) setExistingId(data.id);
    }

    setStatus(selectedStatus);
    setEditing(false);
    setSaving(false);
  };

  if (loading) return null;

  // Saved state
  if (status && !editing) {
    const meta = STATUS_META[status];
    return (
      <Stack direction="row" alignItems="center" gap={1} px={2} pb={1.5}>
        <Typography variant="caption" sx={{ color: meta.color, fontWeight: 600 }}>
          {meta.label}
        </Typography>
        {status === "modified" && note && (
          <Typography variant="caption" color="text.disabled">· {note}</Typography>
        )}
        <Button
          size="small"
          startIcon={<EditRoundedIcon sx={{ fontSize: "0.8rem !important" }} />}
          onClick={() => setEditing(true)}
          sx={{ ml: "auto", textTransform: "none", fontSize: "0.75rem", color: "text.disabled", minWidth: 0, p: 0 }}
        >
          Edit
        </Button>
      </Stack>
    );
  }

  // Input state
  return (
    <Box px={2} pb={1.5}>
      <Divider sx={{ mb: 1.5 }} />
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        How did it go?
      </Typography>

      <Stack direction="row" gap={1} flexWrap="wrap">
        <Button
          size="small"
          variant={status === "completed" ? "contained" : "outlined"}
          color="success"
          startIcon={<CheckRoundedIcon />}
          disabled={saving}
          onClick={() => { setStatus("completed"); handleSave("completed"); }}
          sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.8rem" }}
        >
          Did it
        </Button>
        <Button
          size="small"
          variant={status === "modified" ? "contained" : "outlined"}
          color="warning"
          startIcon={<EditRoundedIcon />}
          disabled={saving}
          onClick={() => setStatus("modified")}
          sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.8rem" }}
        >
          Modified
        </Button>
        <Button
          size="small"
          variant={status === "skipped" ? "contained" : "outlined"}
          color="inherit"
          startIcon={<RemoveCircleOutlineRoundedIcon />}
          disabled={saving}
          onClick={() => { setStatus("skipped"); handleSave("skipped"); }}
          sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.8rem", color: "text.secondary" }}
        >
          Skipped
        </Button>
      </Stack>

      {status === "modified" && (
        <Stack direction="row" gap={1} mt={1.5} alignItems="flex-start">
          <TextField
            size="small"
            fullWidth
            placeholder="What did you do instead? (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave("modified"); }}
            sx={{ "& .MuiInputBase-input": { fontSize: "0.85rem" } }}
          />
          <Button
            size="small"
            variant="contained"
            disabled={saving}
            onClick={() => handleSave("modified")}
            sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.8rem", whiteSpace: "nowrap" }}
          >
            {saving ? <CircularProgress size={14} /> : "Save"}
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default SessionOutcomeLogger;
