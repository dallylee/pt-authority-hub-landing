-- Migration 0003: Add analysis workflow columns
-- These columns support the "Send Analysis to Client" feature

-- Draft of the analysis to send to client
ALTER TABLE leads ADD COLUMN analysis_draft TEXT;

-- Timestamp when analysis was last sent
ALTER TABLE leads ADD COLUMN analysis_sent_at TEXT;
