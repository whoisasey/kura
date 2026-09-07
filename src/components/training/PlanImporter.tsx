"use client";

import { Alert, Box, Button, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useState } from "react";
import type { TrainingPlan } from "@/types/training";
import { parseJsonPlan, parseMarkdownPlan } from "@/lib/training/parsePlan";

interface ParsePreview {
  name: string;
  totalWeeks: number;
  sessionCount: number;
  plan: TrainingPlan;
}

interface PlanImporterProps {
  onSave: (plan: TrainingPlan, raw: string, format: 'json' | 'markdown') => Promise<void>;
}

const PlanImporter = ({ onSave }: PlanImporterProps) => {
  const [tab, setTab] = useState(0);
  const [jsonText, setJsonText] = useState("");
  const [mdText, setMdText] = useState("");
  const [preview, setPreview] = useState<ParsePreview | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentText = tab === 0 ? jsonText : mdText;
  const currentFormat: 'json' | 'markdown' = tab === 0 ? 'json' : 'markdown';

  const handleValidate = () => {
    setParseError(null);
    setPreview(null);
    setSaved(false);
    try {
      const plan = currentFormat === 'json'
        ? parseJsonPlan(currentText)
        : parseMarkdownPlan(currentText);
      const sessionCount = plan.weeks.reduce((sum, w) => sum + w.sessions.length, 0);
      setPreview({ name: plan.name, totalWeeks: plan.totalWeeks, sessionCount, plan });
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Parse failed");
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      await onSave(preview.plan, currentText, currentFormat);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => { setTab(v); setPreview(null); setParseError(null); setSaved(false); }} sx={{ mb: 2 }}>
        <Tab label="JSON" />
        <Tab label="Markdown" />
      </Tabs>

      {tab === 0 && (
        <TextField
          multiline
          rows={12}
          fullWidth
          placeholder='Paste your plan JSON here…'
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
          sx={{ fontFamily: "monospace" }}
        />
      )}

      {tab === 1 && (
        <TextField
          multiline
          rows={12}
          fullWidth
          placeholder={"# Plan Name\ncurrentWeek: 4\ntotalWeeks: 8\n\n## Week 4 | Build 1\n- Sun: heavy | Heavy Lift | Full body compound\n- Tue: run | Easy Run | 3k @ easy pace"}
          value={mdText}
          onChange={e => setMdText(e.target.value)}
          sx={{ fontFamily: "monospace" }}
        />
      )}

      <Stack direction="row" gap={1} mt={2}>
        <Button
          variant="outlined"
          onClick={handleValidate}
          disabled={!currentText.trim()}
          sx={{ borderRadius: 2, textTransform: "none" }}
        >
          Validate & Preview
        </Button>
        {preview && (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            {saving ? "Saving…" : "Save Plan"}
          </Button>
        )}
      </Stack>

      {parseError && (
        <Alert severity="error" sx={{ mt: 2 }}>{parseError}</Alert>
      )}

      {preview && (
        <Box sx={{ mt: 2, p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Preview</Typography>
          <Typography variant="body2">Name: <strong>{preview.name}</strong></Typography>
          <Typography variant="body2">Weeks: {preview.totalWeeks}</Typography>
          <Typography variant="body2">Total sessions: {preview.sessionCount}</Typography>
        </Box>
      )}

      {saved && (
        <Alert severity="success" sx={{ mt: 2 }}>Plan saved successfully.</Alert>
      )}
    </Box>
  );
};

export default PlanImporter;
