-- Migration 0002: Add bottleneck explainability columns
-- These columns store the reasoning and breakdown for the inferred bottleneck

-- Reasons: JSON array of top 3 contributing factors
ALTER TABLE leads ADD COLUMN bottleneck_reasons TEXT;

-- Breakdown: JSON object with domain scores {TRAINING: 5, CONSISTENCY: 3, ...}
ALTER TABLE leads ADD COLUMN bottleneck_breakdown TEXT;

-- Algorithm version for future upgrades
ALTER TABLE leads ADD COLUMN bottleneck_version INTEGER DEFAULT 1;
