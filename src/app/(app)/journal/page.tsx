"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Slider,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import KuraLogo from "@/components/ui/KuraLogo";
import {
  getOrCreateTodayEntry,
  getSymptomsForEntry,
  toggleSymptom,
  updateJournalEntry,
} from "@/lib/supabase/queries/journal";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { prefetchCycleInsight } from "@/lib/cycle/prefetchInsight";
import { useRouter } from "next/navigation";

const moods = ["great", "good", "okay", "low", "awful"] as const;
const moodEmoji: Record<string, string> = {
  great: "😊",
  good: "🙂",
  okay: "😐",
  low: "😔",
  awful: "😞",
};
const symptomList = ["cramps", "bloating", "headache", "acne", "fatigue", "breast_tenderness", "joint_pain", "other"] as const;

interface JournalEntry {
  id: string;
  mood?: string;
  energy_level?: number;
  sleep_quality?: number;
  sleep_hours?: number | string;
  stress_level?: number;
  hydration_level?: number;
  notes?: string;
  [key: string]: unknown;
}

interface Symptom {
  id: string;
  symptom: string;
}

const SectionTitle = ({ children }: { children: string }) => (
  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, textTransform: "capitalize", letterSpacing: 0.5 }}>
    {children}
  </Typography>
);

const JournalPage = () => {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
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

      const e = await getOrCreateTodayEntry(user.id);
      if (!e) return;

      setEntry(e);

      const s = await getSymptomsForEntry(e.id);
      setSymptoms(s);
      setLoading(false);
    };
    load();
  }, [router]);

  const handleUpdate = async (fields: Record<string, unknown>) => {
    if (!entry) return;
    const updated = await updateJournalEntry(entry.id, fields);
    if (updated) {
      setEntry(updated as JournalEntry);
      setSaved(true);
      prefetchCycleInsight();
    }
  };

  const handleToggleSymptom = async (symptom: string) => {
    if (!entry) return;
    const existing = symptoms.find((s) => s.symptom === symptom);
    const result = await toggleSymptom(entry.id, symptom, 1, existing?.id);
    if (existing) {
      setSymptoms((prev) => prev.filter((s) => s.symptom !== symptom));
    } else if (result) {
      setSymptoms((prev) => [...prev, result]);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <KuraLogo />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h2" sx={{ fontSize: "1.5rem", fontWeight: 500 }}>
          {"Today's log"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
        </Typography>
      </Box>

      {/* Mood */}
      <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
        <CardContent>
          <SectionTitle>Mood</SectionTitle>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {moods.map((m) => (
              <Chip
                key={m}
                label={`${moodEmoji[m]} ${m}`}
                onClick={() => handleUpdate({ mood: m })}
                variant={entry?.mood === m ? "filled" : "outlined"}
                color={entry?.mood === m ? "primary" : "default"}
                sx={{ textTransform: "capitalize" }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Sliders */}
      <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {[
            { key: "energy_level", label: "Energy" },
            { key: "sleep_quality", label: "Sleep quality" },
            { key: "stress_level", label: "Stress" },
            { key: "hydration_level", label: "Hydration" },
          ].map(({ key, label }, i, arr) => (
            <Box key={key}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {String(entry?.[key] ?? "—")}
                </Typography>
              </Box>
              <Slider
                min={1}
                max={5}
                step={1}
                value={(entry?.[key] as number) ?? 3}
                onChange={(_, val) => setEntry((prev) => (prev ? { ...prev, [key]: val } : null))}
                onChangeCommitted={(_, val) => handleUpdate({ [key]: val })}
                marks
                size="small"
              />
              {i < arr.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Sleep hours */}
      <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
        <CardContent>
          <SectionTitle>Sleep hours</SectionTitle>
          <TextField
            type="number"
            size="small"
            value={entry?.sleep_hours ?? ""}
            onChange={(e) => setEntry((prev) => (prev ? { ...prev, sleep_hours: e.target.value } : null))}
            onBlur={() => handleUpdate({ sleep_hours: entry?.sleep_hours })}
            inputProps={{ min: 0, max: 24, step: 0.5 }}
            sx={{ width: 120 }}
          />
        </CardContent>
      </Card>

      {/* Symptoms */}
      <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
        <CardContent>
          <SectionTitle>Symptoms</SectionTitle>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {symptomList.map((s) => {
              const active = symptoms.some((sym) => sym.symptom === s);
              return (
                <Chip
                  key={s}
                  label={s.replace("_", " ")}
                  onClick={() => handleToggleSymptom(s)}
                  variant={active ? "filled" : "outlined"}
                  color={active ? "warning" : "default"}
                  size="small"
                />
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
        <CardContent>
          <SectionTitle>Notes</SectionTitle>
          <TextField
            multiline
            rows={3}
            fullWidth
            placeholder="Anything else on your mind..."
            value={entry?.notes ?? ""}
            onChange={(e) => setEntry((prev) => (prev ? { ...prev, notes: e.target.value } : null))}
            onBlur={() => handleUpdate({ notes: entry?.notes })}
            size="small"
          />
        </CardContent>
      </Card>

      <Snackbar
        open={saved}
        autoHideDuration={1500}
        onClose={() => setSaved(false)}
        message="Saved"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ mb: 8 }}
      />
    </Box>
  );
};

export default JournalPage;
