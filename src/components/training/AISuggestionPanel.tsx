"use client";

import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { useState } from "react";
import type { AISuggestion, PlannedSession } from "@/types/training";
import type { CyclePhase } from "@/types/training";

const SUGGESTION_TYPE_META: Record<
  AISuggestion['suggestionType'],
  { label: string; color: 'success' | 'warning' | 'info' | 'default' }
> = {
  increase_intensity: { label: 'Push harder', color: 'success' },
  reduce_load:        { label: 'Ease up',     color: 'warning' },
  add_rest:           { label: 'Rest day',    color: 'warning' },
  swap_session:       { label: 'Swap session', color: 'info' },
  general:            { label: 'General tip', color: 'default' },
};

interface AISuggestionPanelProps {
  session: PlannedSession;
  cyclePhase?: CyclePhase;
  cycleDay?: number;
  moodScore?: number;
  energyScore?: number;
  sleepScore?: number;
}

const AISuggestionPanel = ({
  session,
  cyclePhase,
  cycleDay,
  moodScore,
  energyScore,
  sleepScore,
}: AISuggestionPanelProps) => {
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const fetchSuggestion = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/training/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, cyclePhase, cycleDay, moodScore, energyScore, sleepScore }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json() as AISuggestion;
      setSuggestion(data);
    } catch {
      setError("Couldn't generate a suggestion — try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Stack alignItems="center" py={3} gap={1}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">Checking in with your data…</Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button size="small" onClick={fetchSuggestion}>Retry</Button>
      }>
        {error}
      </Alert>
    );
  }

  if (!suggestion) {
    return (
      <Button variant="contained" onClick={fetchSuggestion} sx={{ borderRadius: 2, textTransform: "none" }}>
        Get AI suggestion
      </Button>
    );
  }

  const meta = SUGGESTION_TYPE_META[suggestion.suggestionType] ?? SUGGESTION_TYPE_META.general;

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: "1.5px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        p: 2.5,
      }}
    >
      <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
        <Typography variant="subtitle2" fontWeight={600}>AI Suggestion</Typography>
        <Chip label={meta.label} size="small" color={meta.color} />
      </Stack>

      <Typography variant="body1" mb={1.5} sx={{ lineHeight: 1.6 }}>
        {suggestion.suggestionText}
      </Typography>

      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
        {suggestion.reasoning}
      </Typography>

      {!applied ? (
        <Button
          size="small"
          variant="outlined"
          onClick={() => setApplied(true)}
          sx={{ borderRadius: 2, textTransform: "none" }}
        >
          Apply this
        </Button>
      ) : (
        <Typography variant="caption" color="success.main" fontWeight={600}>
          ✓ Applied
        </Typography>
      )}
    </Box>
  );
};

export default AISuggestionPanel;
