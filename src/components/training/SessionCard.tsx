"use client";

import { Box, Button, Chip, Stack, Typography } from "@mui/material";

import type { PlannedSession } from "@/types/training";

const SESSION_COLORS: Record<string, string> = {
  run: "primary.main",
  tempo: "warning.main",
  heavy: "secondary.main",
  unilateral: "info.main",
  rest: "text.disabled",
};

const SESSION_BG: Record<string, string> = {
  run: "primary.50",
  tempo: "warning.50",
  heavy: "secondary.50",
  unilateral: "info.50",
  rest: "action.hover",
};

interface SessionCardProps {
  session: PlannedSession;
  isToday?: boolean;
  onAiCheckIn?: () => void;
  showAiButton?: boolean;
}

const SessionCard = ({ session, isToday, onAiCheckIn, showAiButton }: SessionCardProps) => {
  const isRest = session.type === 'rest';
  const color = SESSION_COLORS[session.type] ?? "text.primary";

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: "1.5px solid",
        borderColor: isToday ? color : "divider",
        bgcolor: isToday ? SESSION_BG[session.type] ?? "action.hover" : "background.paper",
        p: 2,
        position: "relative",
        opacity: isRest ? 0.6 : 1,
      }}
    >
      {isToday && (
        <Chip
          label="Today"
          size="small"
          sx={{
            position: "absolute",
            top: 10,
            right: 12,
            fontSize: "0.7rem",
            bgcolor: color,
            color: "background.paper",
          }}
        />
      )}

      <Stack direction="row" alignItems="center" gap={1} mb={session.sub ? 0.5 : 0}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            bgcolor: color,
            flexShrink: 0,
          }}
        />
        <Typography variant="subtitle1" fontWeight={600} sx={{ color: isRest ? "text.disabled" : "text.primary" }}>
          {session.label}
        </Typography>
      </Stack>

      {session.sub && (
        <Typography variant="body2" color="text.secondary" ml={2.75}>
          {session.sub}
        </Typography>
      )}

      {session.distanceKm && (
        <Typography variant="caption" color="text.secondary" ml={2.75}>
          {session.distanceKm} km
        </Typography>
      )}

      {isToday && showAiButton && !isRest && (
        <Stack direction="row" gap={1} mt={1.5}>
          <Button
            size="small"
            variant="outlined"
            onClick={onAiCheckIn}
            sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.8rem" }}
          >
            AI Check-in
          </Button>
          <Button
            size="small"
            variant="text"
            disabled
            sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.8rem", color: "text.disabled" }}
          >
            Log workout
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default SessionCard;
