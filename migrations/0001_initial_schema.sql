-- Migration 0001: Initial PT Console Schema
-- Creates core tables for workspace, users, auth, leads, and uploads

-- Workspaces (multi-tenant support, V1 uses single workspace)
CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    brand_name TEXT,
    booking_link_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- PT Users (staff who access the console)
CREATE TABLE IF NOT EXISTS pt_users (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'STAFF', -- OWNER, STAFF, VIEWER
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    UNIQUE(workspace_id, email)
);

-- PT Sessions (active login sessions)
CREATE TABLE IF NOT EXISTS pt_sessions (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    session_token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    FOREIGN KEY (user_id) REFERENCES pt_users(id)
);

-- Auth Magic Links (email-based passwordless auth)
CREATE TABLE IF NOT EXISTS auth_magic_links (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- Leads (quiz submissions with scoring and triage)
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- Client info
    client_email TEXT NOT NULL,
    client_first_name TEXT,
    client_location TEXT,
    
    -- Quiz answers
    goal TEXT,
    start_timeline TEXT,
    biggest_blocker TEXT,
    training_days_now TEXT,
    time_commitment_weekly TEXT,
    budget_monthly TEXT,
    coaching_preference TEXT,
    injury_flag INTEGER DEFAULT 0,
    injury_notes TEXT,
    wants_upload_stats INTEGER DEFAULT 0,
    
    -- Upload status
    upload_status TEXT DEFAULT 'PENDING', -- PENDING, RECEIVED, NONE
    
    -- Computed triage (server-side)
    triage_score INTEGER,
    triage_segment TEXT, -- HOT, WARM, NURTURE, DISQUALIFIED
    inferred_bottleneck TEXT, -- TRAINING, CONSISTENCY, NUTRITION, RECOVERY, INJURY_CONSTRAINTS, UNKNOWN
    inferred_confidence TEXT, -- HIGH, MEDIUM, LOW
    
    -- PT workflow
    internal_notes TEXT,
    status TEXT DEFAULT 'NEW', -- NEW, IN_REVIEW, CLOSED
    
    -- Security and audit
    lead_token_hash TEXT NOT NULL UNIQUE,
    answers_raw_json TEXT NOT NULL,
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- Uploads (file attachments linked to leads)
CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    lead_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- File metadata
    file_name TEXT NOT NULL,
    mime_type TEXT,
    file_size_bytes INTEGER,
    storage_key TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, DELETED
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_workspace ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(client_email);
CREATE INDEX IF NOT EXISTS idx_leads_segment ON leads(triage_segment);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploads_lead ON uploads(lead_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON pt_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON auth_magic_links(token_hash);
