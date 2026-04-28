"use client";

import { Box, Card, CardContent, Chip, LinearProgress, Typography } from "@mui/material";
import KuraLogo from "@/components/ui/KuraLogo";
import { getRecentEntries, getRecentSymptoms } from "@/lib/supabase/queries/insights";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface JournalEntry {
  id: string;
  entry_date: string;
  mood?: string;
  energy_level?: number;
  sleep_quality?: number;
  sleep_hours?: number;
  stress_level?: number;
  hydration_level?: number;
}

interface SymptomRow {
  symptom: string;
}

const moodEmoji: Record<string, string> = {
  great: "😊",
  good: "🙂",
  okay: "😐",
  low: "😔",
  awful: "😞",
};

const avg = (vals: number[]) =>
  vals.length === 0 ? null : Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;

const InsightsPage = () => {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomRow[]>([]);
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

      const [e, s] = await Promise.all([getRecentEntries(user.id, 30), getRecentSymptoms(user.id, 30)]);
      setEntries(e);
      setSymptoms(s);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <KuraLogo />
      </Box>
    );
  }

  if (entries.length === 0) {
    return (
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        <Box>
          <Typography variant="h2" sx={{ fontSize: "1.5rem", fontWeight: 500 }}>
            Insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last 30 days
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          No journal entries yet. Start logging to see your trends here.
        </Typography>
      </Box>
    );
  }

  // Averages
  const energyVals = entries.map((e) => e.energy_level).filter((v): v is number => v != null);
  const sleepQualityVals = entries.map((e) => e.sleep_quality).filter((v): v is number => v != null);
  const sleepHoursVals = entries.map((e) => e.sleep_hours).filter((v): v is number => v != null);
  const stressVals = entries.map((e) => e.stress_level).filter((v): v is number => v != null);
  const hydrationVals = entries.map((e) => e.hydration_level).filter((v): v is number => v != null);

  const stats = [
    { label: "Avg energy", value: avg(energyVals), max: 5 },
    { label: "Avg sleep quality", value: avg(sleepQualityVals), max: 5 },
    { label: "Avg sleep hours", value: avg(sleepHoursVals), max: 10, suffix: "h" },
    { label: "Avg stress", value: avg(stressVals), max: 5 },
    { label: "Avg hydration", value: avg(hydrationVals), max: 5 },
  ];

  // Mood distribution
  const moodCounts: Record<string, number> = {};
  for (const e of entries) {
    if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] ?? 0) + 1;
  }
  const totalMoods = Object.values(moodCounts).reduce((a, b) => a + b, 0);
  const moodOrder = ["great", "good", "okay", "low", "awful"];

  // Symptom frequency
  const symptomCounts: Record<string, number> = {};
  for (const s of symptoms) {
    symptomCounts[s.symptom] = (symptomCounts[s.symptom] ?? 0) + 1;
  }
  const topSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Entry streak
  const entryDates = new Set(entries.map((e) => e.entry_date));
  let streak = 0;
  const d = new Date();
  while (entryDates.has(d.toISOString().split("T")[0])) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h2" sx={{ fontSize: "1.5rem", fontWeight: 500 }}>
          Insights
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last 30 days · {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </Typography>
      </Box>

      {/* Streak */}
      {streak > 0 && (
        <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Current streak
            </Typography>
            <Typography variant="h2" sx={{ fontSize: "2rem", fontWeight: 500 }}>
              {streak} {streak === 1 ? "day" : "days"}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Averages */}
      <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Averages
          </Typography>
          {stats.map(({ label, value, max, suffix }) =>
            value === null ? null : (
              <Box key={label}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {value}
                    {suffix ?? ` / ${max}`}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(value / max) * 100}
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Box>
            )
          )}
        </CardContent>
      </Card>

      {/* Mood distribution */}
      {totalMoods > 0 && (
        <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Mood distribution
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {moodOrder
                .filter((m) => moodCounts[m])
                .map((mood) => {
                  const count = moodCounts[mood];
                  const pct = Math.round((count / totalMoods) * 100);
                  return (
                    <Box key={mood}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2">
                          {moodEmoji[mood]} {mood}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {count}× · {pct}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{ height: 4, borderRadius: 2 }}
                        color="primary"
                      />
                    </Box>
                  );
                })}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Symptom frequency */}
      {topSymptoms.length > 0 && (
        <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Most common symptoms
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {topSymptoms.map(([symptom, count]) => (
                <Chip
                  key={symptom}
                  label={`${symptom.replace("_", " ")} · ${count}×`}
                  size="small"
                  variant="outlined"
                  color="warning"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default InsightsPage;
