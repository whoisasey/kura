"use client";

import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { useState } from "react";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
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

const PHASE_LABELS: Record<string, string> = {
  menstrual:   'Menstrual phase',
  follicular:  'Follicular phase',
  ovulatory:   'Ovulatory phase',
  luteal:      'Luteal phase',
};

interface AISuggestionPanelProps {
  session: PlannedSession;
  cyclePhase?: CyclePhase;
  cycleDay?: number;
}

const AISuggestionPanel = ({ session, cyclePhase, cycleDay }: AISuggestionPanelProps) => {
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestion = async () => {
    setLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const res = await fetch("/api/training/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, cyclePhase, cycleDay }),
      });
      if (!res.ok) throw new Error("Request failed");
      setSuggestion(await res.json() as AISuggestion);
    } catch {
      setError("Couldn't generate a suggestion — try again.");
    } finally {
      setLoading(false);
    }
  };

  const phaseLabel = cyclePhase ? PHASE_LABELS[cyclePhase] ?? cyclePhase : null;

  return (
    <Box
      sx={{
        mt: 1.5,
        borderRadius: 3,
        border: "1.5px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        p: 2.5,
      }}
    >
      <Stack direction="row" alignItems="center" gap={1} mb={suggestion || loading || error ? 1.5 : 0} flexWrap="wrap">
        <Typography variant="subtitle2" fontWeight={600}>AI Suggestion</Typography>
        {phaseLabel && (
          <Chip label={phaseLabel} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
        )}
      </Stack>

      {/* Idle — no suggestion yet */}
      {!loading && !suggestion && !error && (
        <Button
          size="small"
          variant="outlined"
          startIcon={<AutoAwesomeRoundedIcon fontSize="small" />}
          onClick={fetchSuggestion}
          sx={{ textTransform: "none", borderRadius: 2, fontSize: "0.8rem" }}
        >
          Get suggestion
        </Button>
      )}

      {loading && (
        <Stack alignItems="center" py={2} gap={1}>
          <CircularProgress size={22} />
          <Typography variant="body2" color="text.secondary">
            Checking in with your data…
          </Typography>
        </Stack>
      )}

      {error && (
        <Alert
          severity="error"
          action={<Button size="small" onClick={fetchSuggestion}>Retry</Button>}
        >
          {error}
        </Alert>
      )}

      {suggestion && (() => {
        const meta = SUGGESTION_TYPE_META[suggestion.suggestionType] ?? SUGGESTION_TYPE_META.general;
        return (
          <Stack gap={1.5}>
            <Chip label={meta.label} size="small" color={meta.color} sx={{ alignSelf: "flex-start" }} />
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              {suggestion.suggestionText}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {suggestion.reasoning}
            </Typography>
            <Button
              size="small"
              variant="text"
              onClick={fetchSuggestion}
              sx={{ alignSelf: "flex-start", textTransform: "none", fontSize: "0.75rem", color: "text.secondary" }}
            >
              Refresh suggestion
            </Button>
          </Stack>
        );
      })()}
    </Box>
  );
};

export default AISuggestionPanel;
