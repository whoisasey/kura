-- Add call_type column to predictions table to distinguish between
-- different types of AI-generated predictions (e.g. 'prediction', 'cycle_insight')
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS call_type text DEFAULT 'prediction';
