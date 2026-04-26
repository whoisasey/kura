"use client";

import { Box, Button, Card, CardContent, Chip, Skeleton, Typography } from "@mui/material";
import type { EnvAlerts, WeatherReading } from "@/types/index";
import { getLatestCycle, getTodayEntry, getTodayPrediction } from "@/lib/supabase/queries/dashboard";
import { useEffect, useState } from "react";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import DirectionsRunRoundedIcon from "@mui/icons-material/DirectionsRunRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import EnvBanner from "@/components/env/EnvBanner";
import { createClient } from "@/lib/supabase/client";
import { getLatestWeatherReading } from "@/lib/supabase/queries/weather";
import { useRouter } from "next/navigation";

interface Prediction {
  phase?: string;
  hormone_note?: string;
  suggested_meals?: string[];
  suggested_activities?: string[];
  general_heads_up?: string;
  call_type?: string;
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

const getGreeting = (name: string | null) => {
  const hour = new Date().getHours();
  const suffix = name ? `, ${name}` : "";
  if (hour < 12) return `Good morning${suffix}`;
  if (hour < 17) return `Good afternoon${suffix}`;
  return `Good evening${suffix}`;
};

const getDisplayName = (user: { user_metadata?: { display_name?: string }; email?: string } | null): string | null => {
  if (!user) return null;
  if (user.user_metadata?.display_name) return user.user_metadata.display_name;
  if (user.email) {
    const local = user.email.split("@")[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return null;
};

const formatDate = () =>
  new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

const deriveEnvAlerts = (reading: WeatherReading | null): EnvAlerts => ({
  pressureDelta: reading?.pressure_delta_6h ?? null,
  pressureDropForecast: reading?.pressure_drop_forecast ?? false,
  aqiAlert: typeof reading?.aqi === "number" && reading.aqi > 50,
  aqi: reading?.aqi ?? null,
  uvHigh: typeof reading?.uv_index === "number" && reading.uv_index >= 6,
  uvIndex: reading?.uv_index ?? null,
  temperatureC: reading?.temperature_c ?? null,
  lastUpdated: reading?.recorded_at ?? null,
});

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [cycleDay, setCycleDay] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [todayEntry, setTodayEntry] = useState<TodayEntry | null>(null);
  const [weatherReading, setWeatherReading] = useState<WeatherReading | null>(null);
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

      setDisplayName(getDisplayName(user));

      const [pred, cyc, entry, weather] = await Promise.all([
        getTodayPrediction(user.id),
        getLatestCycle(user.id),
        getTodayEntry(user.id),
        getLatestWeatherReading(supabase, user.id),
      ]);

      setPrediction(pred);
      setCycle(cyc);
      setTodayEntry(entry);
      if (weather) setWeatherReading(weather);

      if (cyc?.period_start) {
        const [y, m, d] = cyc.period_start.split("-").map(Number);
        const start = new Date(y, m - 1, d);
        const day = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setCycleDay(day);
      }

      setLoading(false);

      // Request geolocation and refresh weather in background
      if (typeof window !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const res = await fetch("/api/weather", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                }),
              });
              if (res.ok) {
                const fresh = (await res.json()) as WeatherReading & { skipped?: boolean; error?: string };
                if (!fresh.skipped && !fresh.error) {
                  setWeatherReading(fresh);
                }
              }
            } catch {
              // weather fetch failure is non-fatal
            }
          },
          () => {
            // geolocation denied — show whatever we already have
          }
        );
      }
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
  const envAlerts = deriveEnvAlerts(weatherReading);

  const cycleInsight = (() => {
    if (prediction?.call_type !== "cycle_insight" || !prediction.hormone_note) return null;
    try {
      return JSON.parse(prediction.hormone_note) as {
        hormone_note: { headline: string };
        exercise: { recommended_type: string; duration_minutes: number };
      };
    } catch {
      return null;
    }
  })();

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h2" sx={{ fontSize: "1.5rem", fontWeight: 500 }}>
          {getGreeting(displayName)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatDate()}
        </Typography>
      </Box>

      {/* Env banner — above phase card */}
      <EnvBanner alerts={envAlerts} />

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
              {cycleInsight && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {cycleInsight.hormone_note.headline}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <DirectionsRunRoundedIcon sx={{ fontSize: 15, color: "text.disabled" }} />
                    <Typography variant="caption" color="text.disabled">
                      {cycleInsight.exercise.recommended_type} · {cycleInsight.exercise.duration_minutes} min
                    </Typography>
                  </Box>
                </Box>
              )}
              {!cycleInsight && prediction?.hormone_note && prediction?.call_type !== "cycle_insight" && (
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
                  {`Today's note`}
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
              <Typography variant="body1" fontWeight={500} color="text.primary">
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
