"use client";

import { Box, IconButton, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Link from "next/link";
import PlanImporter from "@/components/training/PlanImporter";
import { createClient } from "@/lib/supabase/client";
import { upsertPlan } from "@/lib/training/trainingService";
import { useRouter } from "next/navigation";
import type { TrainingPlan } from "@/types/training";

const ImportPage = () => {
  const router = useRouter();

  const handleSave = async (plan: TrainingPlan, raw: string, format: 'json' | 'markdown') => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    await upsertPlan(supabase, user.id, plan, raw, format);
    router.push("/training");
  };

  return (
    <Box p={3}>
      <Stack direction="row" alignItems="center" gap={1} mb={3}>
        <IconButton component={Link} href="/training" size="small" edge="start">
          <ArrowBackRoundedIcon />
        </IconButton>
        <Typography variant="h6" fontWeight={700}>Import Plan</Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Paste your training plan as JSON or Markdown. Importing will update your active plan while preserving your current week.
      </Typography>

      <PlanImporter onSave={handleSave} />
    </Box>
  );
};

export default ImportPage;
