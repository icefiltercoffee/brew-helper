CREATE TABLE IF NOT EXISTS brew_outcomes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  coffee_fingerprint TEXT NOT NULL,
  brewer TEXT,
  grinder TEXT,
  observed_json TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_brew_outcomes_user_coffee
  ON brew_outcomes(user_id, coffee_fingerprint, created_at DESC);

CREATE TABLE IF NOT EXISTS equipment_calibrations (
  user_id TEXT NOT NULL,
  equipment_key TEXT NOT NULL,
  grind_bias TEXT NOT NULL CHECK (grind_bias IN ('finer', 'coarser')),
  evidence_count INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, equipment_key)
);

CREATE TABLE IF NOT EXISTS principle_candidates (
  id TEXT PRIMARY KEY,
  statement TEXT NOT NULL,
  mechanism TEXT NOT NULL,
  domain TEXT NOT NULL,
  source_ids_json TEXT NOT NULL,
  independent_count INTEGER NOT NULL,
  origin TEXT NOT NULL CHECK (origin IN ('research', 'brew-history')),
  coffee_fingerprint TEXT,
  status TEXT NOT NULL CHECK (status IN ('needs_review', 'rejected', 'promoted')),
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  review_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_candidates_status_created
  ON principle_candidates(status, created_at DESC);

CREATE TABLE IF NOT EXISTS recommendation_traces (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  coffee_fingerprint TEXT NOT NULL,
  state TEXT NOT NULL,
  principles_json TEXT NOT NULL,
  science_flags INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_traces_user_created
  ON recommendation_traces(user_id, created_at DESC);
