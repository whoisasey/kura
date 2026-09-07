"use client";

import { Box, Card, CardContent, Chip, Typography } from "@mui/material";

const phases = [
  {
    name: "Menstrual",
    days: "Days 1–5",
    color: "#C49A72",
    summary: "Your period begins. Estrogen and progesterone are at their lowest.",
    energy: "Low",
    mood: "Introspective, tender",
    hormones: ["Low estrogen", "Low progesterone"],
    foods: ["Iron-rich foods", "Dark chocolate", "Warm soups", "Ginger tea"],
    movement: ["Gentle yoga", "Walking", "Rest"],
    tips: [
      "Honor your need for rest — this is the body's renewal phase.",
      "Warmth helps ease cramps: hot water bottle, warm baths.",
      "Iron and magnesium are lost with blood — replenish them.",
    ],
  },
  {
    name: "Follicular",
    days: "Days 6–13",
    color: "#8B5A3A",
    summary: "Estrogen rises as follicles develop. Energy and focus build.",
    energy: "Building",
    mood: "Curious, optimistic",
    hormones: ["Rising estrogen", "Low progesterone"],
    foods: ["Fermented foods", "Leafy greens", "Eggs", "Flaxseeds"],
    movement: ["Heavy compound lifts", "Easy run", "Unilateral strength work"],
    tips: [
      "Great time to start new projects — estrogen boosts creativity and motivation.",
      "Your pain tolerance is higher now; push a little harder in workouts.",
      "Social energy is up — schedule meetings or catch-ups.",
    ],
  },
  {
    name: "Ovulation",
    days: "Days 14–16",
    color: "#D4853A",
    summary: "A mature egg is released. Estrogen peaks; LH and FSH surge.",
    energy: "Peak",
    mood: "Confident, magnetic",
    hormones: ["Peak estrogen", "LH surge", "Rising testosterone"],
    foods: ["Antioxidant-rich fruits", "Quinoa", "Salmon", "Zinc-rich foods"],
    movement: ["Tempo run", "Heavy lifts — peak intensity window", "Long run at effort"],
    tips: [
      "You're at peak verbal and social ability — great for presentations.",
      "Testosterone boost makes this a good time for competitive or high-effort work.",
      "Eat lighter — metabolism slows slightly compared to follicular phase.",
    ],
  },
  {
    name: "Luteal",
    days: "Days 17–28",
    color: "#6B8F71",
    summary: "Progesterone rises to prepare for potential pregnancy, then drops.",
    energy: "Declining",
    mood: "Detail-oriented, then PMS possible",
    hormones: ["High progesterone", "Declining estrogen"],
    foods: ["Complex carbs", "B vitamins", "Magnesium-rich foods", "Leafy greens"],
    movement: ["Unilateral focus (−15% load)", "Easy pace runs only", "Long run at easy pace"],
    tips: [
      "Good phase for detail work, editing, and completion tasks.",
      "Cravings are real — progesterone raises metabolism slightly, so you genuinely need more calories.",
      "Magnesium can ease PMS symptoms: dark leafy greens, pumpkin seeds, nuts.",
    ],
  },
];

const LibraryPage = () => {
  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h2" sx={{ fontSize: "1.5rem", fontWeight: 500 }}>
          Library
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Understanding your cycle phases
        </Typography>
      </Box>

      {phases.map((phase) => (
        <Card key={phase.name} elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
          <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Phase header */}
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: phase.color,
                  flexShrink: 0,
                  mt: 0.5,
                }}
              />
              <Box>
                <Typography variant="h3" sx={{ fontSize: "1.1rem", fontWeight: 500 }}>
                  {phase.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {phase.days}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2">{phase.summary}</Typography>

            {/* Hormones */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                Hormones
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {phase.hormones.map((h) => (
                  <Chip key={h} label={h} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
                ))}
              </Box>
            </Box>

            {/* Energy & mood */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
                  Energy
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {phase.energy}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
                  Mood
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {phase.mood}
                </Typography>
              </Box>
            </Box>

            {/* Foods */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                Supportive foods
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {phase.foods.map((f) => (
                  <Chip key={f} label={f} size="small" sx={{ bgcolor: "background.default", fontSize: "0.7rem" }} />
                ))}
              </Box>
            </Box>

            {/* Movement */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                Movement
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {phase.movement.map((m) => (
                  <Chip key={m} label={m} size="small" sx={{ bgcolor: "background.default", fontSize: "0.7rem" }} />
                ))}
              </Box>
            </Box>

            {/* Tips */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {phase.tips.map((tip, i) => (
                <Typography key={i} variant="body2" color="text.secondary" sx={{ pl: 1.5, position: "relative" }}>
                  <Box
                    component="span"
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: "0.45em",
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      bgcolor: phase.color,
                      display: "inline-block",
                    }}
                  />
                  {tip}
                </Typography>
              ))}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default LibraryPage;
