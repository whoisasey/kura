"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Slider,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import {
  addActivity,
  addMeal,
  deleteActivity,
  deleteMeal,
  getActivitiesForEntry,
  getMealsForEntry,
  getOrCreateTodayEntry,
  getSymptomsForEntry,
  toggleSymptom,
  updateJournalEntry,
} from "@/lib/supabase/queries/journal";
import { useEffect, useState } from "react";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const moods = ["great", "good", "okay", "low", "awful"] as const;
const moodEmoji: Record<string, string> = {
  great: "😊",
  good: "🙂",
  okay: "😐",
  low: "😔",
  awful: "😞",
};
const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;
const activityTypes = ["exercise", "rest", "social", "creative", "work", "other"] as const;
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

interface Meal {
  id: string;
  meal_type: string;
  description: string;
}

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  duration_minutes?: number;
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
  const [meals, setMeals] = useState<Meal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [newMealType, setNewMealType] = useState("breakfast");
  const [newMealDesc, setNewMealDesc] = useState("");
  const [newActivityType, setNewActivityType] = useState("exercise");
  const [newActivityDesc, setNewActivityDesc] = useState("");
  const [newActivityDuration, setNewActivityDuration] = useState("");
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

      const [m, a, s] = await Promise.all([
        getMealsForEntry(e.id),
        getActivitiesForEntry(e.id),
        getSymptomsForEntry(e.id),
      ]);

      setMeals(m);
      setActivities(a);
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
    }
  };

  const handleAddMeal = async () => {
    if (!entry || !newMealDesc.trim()) return;
    const meal = await addMeal(entry.id, newMealType, newMealDesc.trim());
    if (meal) {
      setMeals((prev) => [...prev, meal]);
      setNewMealDesc("");
    }
  };

  const handleDeleteMeal = async (id: string) => {
    await deleteMeal(id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAddActivity = async () => {
    if (!entry || !newActivityDesc.trim()) return;
    const act = await addActivity(
      entry.id,
      newActivityType,
      newActivityDesc.trim(),
      newActivityDuration ? parseInt(newActivityDuration) : undefined
    );
    if (act) {
      setActivities((prev) => [...prev, act]);
      setNewActivityDesc("");
      setNewActivityDuration("");
    }
  };

  const handleDeleteActivity = async (id: string) => {
    await deleteActivity(id);
    setActivities((prev) => prev.filter((a) => a.id !== id));
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
        <CircularProgress />
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

      {/* Meals */}
      <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
        <CardContent>
          <SectionTitle>Meals</SectionTitle>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
            {meals.map((meal) => (
              <Box key={meal.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip label={meal.meal_type} size="small" sx={{ textTransform: "capitalize", minWidth: 80 }} />
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {meal.description}
                </Typography>
                <IconButton size="small" onClick={() => handleDeleteMeal(meal.id)}>
                  <DeleteRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              {mealTypes.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  size="small"
                  onClick={() => setNewMealType(t)}
                  variant={newMealType === t ? "filled" : "outlined"}
                  color={newMealType === t ? "primary" : "default"}
                  sx={{ textTransform: "capitalize" }}
                />
              ))}
            </Box>
            <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
              <TextField
                size="small"
                placeholder="What did you eat?"
                value={newMealDesc}
                onChange={(e) => setNewMealDesc(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMeal()}
                fullWidth
              />
              <IconButton onClick={handleAddMeal} disabled={!newMealDesc.trim()} color="primary">
                <AddRoundedIcon />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Activities */}
      <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
        <CardContent>
          <SectionTitle>Activities</SectionTitle>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
            {activities.map((act) => (
              <Box key={act.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip label={act.activity_type} size="small" sx={{ textTransform: "capitalize", minWidth: 80 }} />
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {act.description}
                  {act.duration_minutes ? ` · ${act.duration_minutes}min` : ""}
                </Typography>
                <IconButton size="small" onClick={() => handleDeleteActivity(act.id)}>
                  <DeleteRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
            {activityTypes.map((t) => (
              <Chip
                key={t}
                label={t}
                size="small"
                onClick={() => setNewActivityType(t)}
                variant={newActivityType === t ? "filled" : "outlined"}
                color={newActivityType === t ? "primary" : "default"}
                sx={{ textTransform: "capitalize" }}
              />
            ))}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              placeholder="What did you do?"
              value={newActivityDesc}
              onChange={(e) => setNewActivityDesc(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddActivity()}
              sx={{ flex: 2 }}
            />
            <TextField
              size="small"
              placeholder="mins"
              type="number"
              value={newActivityDuration}
              onChange={(e) => setNewActivityDuration(e.target.value)}
              sx={{ flex: 1 }}
            />
            <IconButton onClick={handleAddActivity} disabled={!newActivityDesc.trim()} color="primary">
              <AddRoundedIcon />
            </IconButton>
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
