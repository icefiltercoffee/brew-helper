ALTER TABLE recommendation_traces
  ADD COLUMN model_cost_microusd INTEGER NOT NULL DEFAULT 0;
