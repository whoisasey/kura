ALTER TABLE cycles
  ADD COLUMN IF NOT EXISTS flow_intensity text
    CHECK (flow_intensity IN ('light', 'medium', 'heavy'));
