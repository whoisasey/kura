"use client";

import { Box, Button, Card, CardContent, Chip, CircularProgress, IconButton, Snackbar, TextField, Typography } from "@mui/material";
import { deleteCycle, getCycles, logCycle } from "@/lib/supabase/queries/cycle";
import { useEffect, useState } from "react";

import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Cycle {
  id: string;
  period_start: string;
  phase?: string;
}

const phaseColors: Record<string, string> = {
  menstrual: "#C49A72",
  follicular: "#8B5A3A",
  ovulation: "#D4853A",
  luteal: "#6B8F71",
};

const getPhaseFromDay = (day: number): string => {
  if (day <= 5) return "menstrual";
  if (day <= 13) return "follicular";
  if (day <= 16) return "ovulation";
  return "luteal";
};

const getCycleDay = (periodStart: string) => {
  const start = new Date(periodStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });

const today = () => new Date().toISOString().split("T")[0];

const CyclePage = () => {
  const [loading, setLoading] = useState(true);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(today());
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

      setUserId(user.id);
      const data = await getCycles(user.id);
      setCycles(data);
      setLoading(false);
    };
    load();
  }, [router]);

  const handleLog = async () => {
    if (!userId || !selectedDate) return;
    setSaving(true);
    const result = await logCycle(userId, selectedDate);
    if (result) {
      setCycles((prev) => [result, ...prev].sort((a, b) => (a.period_start < b.period_start ? 1 : -1)));
      setSnackbar("Period start logged");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await deleteCycle(id);
    setCycles((prev) => prev.filter((c) => c.id !== id));
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const latest = cycles[0] ?? null;
  const cycleDay = latest ? getCycleDay(latest.period_start) : null;
  const currentPhase = cycleDay !== null && cycleDay > 0 ? getPhaseFromDay(cycleDay) : null;
  const alreadyLogged = cycles.some((c) => c.period_start === selectedDate);

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h2" sx={{ fontSize: "1.5rem", fontWeight: 500 }}>
          Cycle
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your period start dates
        </Typography>
      </Box>

      {/* Current status */}
      <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
        <CardContent>
          {currentPhase && cycleDay !== null ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <WaterDropRoundedIcon sx={{ fontSize: 18, color: phaseColors[currentPhase] }} />
                <Typography variant="body2" color="text.secondary">
                  Current phase
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography variant="h2" sx={{ fontSize: "1.75rem", fontWeight: 500, textTransform: "capitalize" }}>
                  {currentPhase}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  day {cycleDay}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Since {formatDate(latest!.period_start)}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No cycle logged yet
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Log form */}
      <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Log period start
          </Typography>
          <TextField
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            inputProps={{ max: today() }}
            fullWidth
          />
          <Button
            variant="contained"
            onClick={handleLog}
            disabled={saving || alreadyLogged || !selectedDate}
          >
            {alreadyLogged ? "Already logged for this date" : "Save"}
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      {cycles.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            History
          </Typography>
          {cycles.map((cycle, i) => {
            const day = getCycleDay(cycle.period_start);
            const phase = day > 0 ? getPhaseFromDay(day) : null;
            return (
              <Card key={cycle.id} elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
                <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5, py: "12px !important" }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDate(cycle.period_start)}
                    </Typography>
                    {i === 0 && phase && (
                      <Chip
                        label={phase}
                        size="small"
                        sx={{
                          mt: 0.5,
                          textTransform: "capitalize",
                          bgcolor: phaseColors[phase] + "22",
                          color: phaseColors[phase],
                          border: "none",
                          fontSize: "0.7rem",
                        }}
                      />
                    )}
                    {i > 0 && cycles[i - 1] && (
                      <Typography variant="caption" color="text.secondary">
                        {getCycleDay(cycle.period_start) > 0
                          ? `${Math.abs(
                              Math.floor(
                                (new Date(cycles[i - 1].period_start).getTime() -
                                  new Date(cycle.period_start).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            )} day cycle`
                          : ""}
                      </Typography>
                    )}
                  </Box>
                  <IconButton size="small" onClick={() => handleDelete(cycle.id)}>
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Snackbar
        open={!!snackbar}
        autoHideDuration={2000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ mb: 8 }}
      />
    </Box>
  );
};

export default CyclePage;
