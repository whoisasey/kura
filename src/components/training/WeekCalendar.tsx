"use client";

import { Box, Stack, Typography } from "@mui/material";

import type { PlannedSession } from "@/types/training";

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const SESSION_COLORS: Record<string, string> = {
  run: "primary.main",
  tempo: "warning.main",
  heavy: "secondary.main",
  unilateral: "info.main",
  rest: "transparent",
};

interface WeekCalendarProps {
  sessions: PlannedSession[];
  todayDow: number;
}

const WeekCalendar = ({ sessions, todayDow }: WeekCalendarProps) => {
  const sessionByDay = sessions.reduce<Record<number, PlannedSession>>((acc, s) => {
    acc[s.dayOfWeek] = s;
    return acc;
  }, {});

  return (
    <Stack direction="row" justifyContent="space-between" gap={0.5}>
      {Array.from({ length: 7 }, (_, i) => {
        const session = sessionByDay[i];
        const isToday = i === todayDow;
        const isRest = !session || session.type === 'rest';
        const dotColor = session ? SESSION_COLORS[session.type] : "transparent";

        return (
          <Stack key={i} alignItems="center" gap={0.5} flex={1}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: isToday ? 700 : 400,
                color: isToday ? "primary.main" : "text.secondary",
                fontSize: "0.7rem",
              }}
            >
              {DAY_LABELS[i]}
            </Typography>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "1.5px solid",
                borderColor: isToday ? "primary.main" : "divider",
                bgcolor: isToday ? "primary.main" : "background.paper",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              {!isRest && (
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    bgcolor: isToday ? "background.paper" : dotColor,
                  }}
                />
              )}
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.6rem",
                color: isToday ? "primary.main" : "text.disabled",
                textAlign: "center",
                lineHeight: 1,
                minHeight: "1em",
              }}
            >
              {session && !isRest ? session.label.split(' ')[0] : ''}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
};

export default WeekCalendar;
