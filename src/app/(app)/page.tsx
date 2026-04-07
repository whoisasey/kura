"use client";

import { Alert, Box, Button, Card, CardContent, Chip, Skeleton, Typography } from "@mui/material";
import { getLatestCycle, getTodayEntry, getTodayPrediction } from "@/lib/supabase/queries/dashboard";
import { useEffect, useState } from "react";

import AirRoundedIcon from "@mui/icons-material/AirRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Prediction {
  phase?: string;
  hormone_note?: string;
  pressure_alert?: boolean;
  aqi_alert?: boolean;
  suggested_meals?: string[];
  suggested_activities?: string[];
  general_heads_up?: string;
}

interface Cycle {
  phase?: string;
  period_start?: string;
}

interface TodayEntry {
  energy_level?: number;
  sleep_hours?: number;
  stress_level?: number;
  hydration_level?: number;
}

const phaseLabels: Record<string, string> = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulation: "Ovulation",
  luteal: "Luteal",
};

const phaseColors: Record<string, string> = {
  menstrual: "#C49A72",
  follicular: "#8B5A3A",
  ovulation: "#D4853A",
  luteal: "#6B8F71",
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const formatDate = () =>
  new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [cycleDay, setCycleDay] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [todayEntry, setTodayEntry] = useState<TodayEntry | null>(null);
  const router = useRouter();

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

      const [pred, cyc, entry] = await Promise.all([
        getTodayPrediction(user.id),
        getLatestCycle(user.id),
        getTodayEntry(user.id),
      ]);

      setPrediction(pred);
      setCycle(cyc);
      setTodayEntry(entry);
      if (cyc?.period_start) {
        const day = Math.floor((Date.now() - new Date(cyc.period_start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setCycleDay(day);
      }
      setLoading(false);
    };

    load();
  }, [router]);

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        <Skeleton variant="text" width={180} height={40} />
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={80} />
        <Skeleton variant="rounded" height={160} />
      </Box>
    );
  }

  const phase = prediction?.phase ?? cycle?.phase ?? null;

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h2" sx={{ fontSize: "1.5rem", fontWeight: 500 }}>
          {getGreeting()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatDate()}
        </Typography>
      </Box>

      {/* Phase card */}
      <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
        <CardContent>
          {phase ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AutoAwesomeRoundedIcon sx={{ fontSize: 18, color: phaseColors[phase] }} />
                <Typography variant="body2" color="text.secondary">
                  Current phase
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography variant="h2" sx={{ fontSize: "1.75rem", fontWeight: 500 }}>
                  {phaseLabels[phase]}
                </Typography>
                {cycleDay && (
                  <Typography variant="body2" color="text.secondary">
                    day {cycleDay}
                  </Typography>
                )}
              </Box>
              {prediction?.hormone_note && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {prediction.hormone_note}
                </Typography>
              )}
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                No cycle data yet
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => router.push("/cycle")}
                sx={{ alignSelf: "flex-start" }}
              >
                Log your cycle
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      {prediction?.pressure_alert && (
        <Alert severity="warning" icon={<AirRoundedIcon />} sx={{ borderRadius: 2 }}>
          Pressure dropping — headache risk today. Stay hydrated.
        </Alert>
      )}

      {prediction?.aqi_alert && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Air quality is poor today. Consider indoor workouts.
        </Alert>
      )}

      {/* Recommendations */}
      {prediction && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Meals */}
          {(prediction.suggested_meals ?? []).length > 0 && (
            <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Recommended meals
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {(prediction.suggested_meals ?? []).map((meal: string, i: number) => (
                    <Typography key={i} variant="body2">
                      {meal}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Activities */}
          {(prediction.suggested_activities ?? []).length > 0 && (
            <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Recommended activities
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {(prediction.suggested_activities ?? []).map((act: string, i: number) => (
                    <Chip key={i} label={act} size="small" sx={{ bgcolor: "background.paper" }} />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* General heads up */}
          {prediction.general_heads_up && (
            <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {` Today's note`}
                </Typography>
                <Typography variant="body2">{prediction.general_heads_up}</Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Quick stats */}
      {todayEntry && (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
          {[
            { label: "Energy", value: `${todayEntry.energy_level} / 5` },
            { label: "Sleep", value: todayEntry.sleep_hours ? `${todayEntry.sleep_hours}h` : "—" },
            { label: "Stress", value: todayEntry.stress_level ? `${todayEntry.stress_level} / 5` : "—" },
            { label: "Hydration", value: todayEntry.hydration_level ? `${todayEntry.hydration_level} / 5` : "—" },
          ].map((stat) => (
            <Box
              key={stat.label}
              sx={{
                bgcolor: "background.paper",
                borderRadius: 2,
                p: 1.5,
                border: "0.5px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
              <Typography variant="body1" color="text.primary" fontWeight={500}>
                {stat.value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Journal CTA */}
      {!todayEntry && (
        <Button
          variant="contained"
          startIcon={<EditNoteRoundedIcon />}
          onClick={() => router.push("/journal")}
          fullWidth
          size="large"
        >
          Log today
        </Button>
      )}
    </Box>
  );
};

export default DashboardPage;
