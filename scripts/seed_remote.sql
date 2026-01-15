INSERT OR IGNORE INTO workspaces (id, name, slug, created_at)
VALUES ('06077e73-9a5e-4c38-9968-f653698e2345', 'Default Workspace', 'default', datetime('now'));

INSERT OR IGNORE INTO pt_users (id, workspace_id, email, name, role, created_at)
VALUES ('830f09e2-e303-4059-98ed-b8f13e6f522e', '06077e73-9a5e-4c38-9968-f653698e2345', 'dallyzg@gmail.com', 'Dali', 'OWNER', datetime('now'));
