<#
PT Console V1: Setup + Verify (D1 + Pages config) for:
C:\PROJECTS\pt-authority-hub-landing

What it does:
- Ensures wrangler.jsonc has D1 binding DB
- Runs D1 migrations (local + remote)
- Seeds workspace + PT owner user (remote)
- Optionally patches Cloudflare Pages project env vars + D1 bindings via API token
- Prints a token block with verification queries

Secrets:
- Never prints secrets in full
- Never writes secrets into git-tracked files
#>

[CmdletBinding()]
param(
  [string]$RepoRoot = "C:\PROJECTS\pt-authority-hub-landing",
  [string]$DbName   = "pt-authority-hub-db",
  [string]$DbId     = "324ee536-b279-4798-95d3-b8b24940a1d5",
  [string]$PagesProjectName = "pt-authority-hub-landing",
  [string]$WorkspaceSlug = "default",
  [string]$WorkspaceName = "Default Workspace",

  # Prompted if not provided:
  [string]$PtOwnerEmail = "",
  [string]$PtOwnerName  = "Owner",

  # Optional: set Pages env vars + D1 binding automatically
  [switch]$ConfigurePagesViaApi,

  # If not passed, will try $env:CLOUDFLARE_API_TOKEN
  [string]$CloudflareApiToken = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function New-RandomUrlSafeToken([int]$bytes = 32) {
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $data = New-Object byte[] $bytes
  $rng.GetBytes($data)
  $b64 = [Convert]::ToBase64String($data)
  # Base64url
  return ($b64.TrimEnd("=").Replace("+","-").Replace("/","_"))
}

function Mask([string]$s) {
  if (-not $s) { return "" }
  if ($s.Length -le 8) { return "********" }
  return ("****" + $s.Substring($s.Length-4,4))
}

function Write-Section([string]$title) {
  Write-Host ""
  Write-Host "=== $title ===" -ForegroundColor Cyan
}

Write-Section "Preflight"
if (-not (Test-Path $RepoRoot)) { throw "RepoRoot not found: $RepoRoot" }
Set-Location $RepoRoot

# Basic required files
$wranglerPath = Join-Path $RepoRoot "wrangler.jsonc"
if (-not (Test-Path $wranglerPath)) { throw "wrangler.jsonc not found at: $wranglerPath" }

$migrationPath = Join-Path $RepoRoot "migrations\0001_initial_schema.sql"
if (-not (Test-Path $migrationPath)) {
  throw "Migration missing: $migrationPath. Expected from your implementation report."
}

# Ensure Wrangler available
& npx wrangler --version | Out-Host

Write-Section "Ensure wrangler.jsonc has D1 binding DB"
$wranglerRaw = Get-Content $wranglerPath -Raw

# Insert or update d1_databases binding block in JSONC (string-based, tolerant of JSONC comments)
if ($wranglerRaw -match '"d1_databases"\s*:' ) {
  # Update binding to DB if it exists with another binding
  $updated = $wranglerRaw

  # If the DB entry exists but binding is not DB, try to replace the binding value for this db_id
  # Fallback: replace any "binding": "pt_authority_hub_db" with "binding": "DB"
  $updated = $updated -replace '"binding"\s*:\s*"pt_authority_hub_db"', '"binding": "DB"'

  # Also ensure database_id and database_name are correct if present
  $updated = $updated -replace '"database_name"\s*:\s*"[^"]+"', ('"database_name": "' + $DbName + '"')
  $updated = $updated -replace '"database_id"\s*:\s*"[^"]+"',   ('"database_id": "' + $DbId + '"')

  if ($updated -ne $wranglerRaw) {
    Copy-Item $wranglerPath ($wranglerPath + ".bak") -Force
    Set-Content -Path $wranglerPath -Value $updated -Encoding UTF8
    Write-Host "Updated existing d1_databases block. Backup written to wrangler.jsonc.bak"
  } else {
    Write-Host "d1_databases block already present, no change required."
  }
} else {
  # Insert a new d1_databases block before final }
  $insertion = @"

  // D1 binding for PT Console
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "$DbName",
      "database_id": "$DbId"
    }
  ]
"@

  $idx = $wranglerRaw.LastIndexOf("}")
  if ($idx -lt 0) { throw "wrangler.jsonc appears malformed, cannot find closing brace." }

  $before = $wranglerRaw.Substring(0, $idx).TrimEnd()
  $after  = $wranglerRaw.Substring($idx)

  # Ensure there's a trailing comma before insertion if needed
  if ($before -notmatch ",\s*$") { $before = $before + "," }

  $patched = $before + $insertion + "`n" + $after

  Copy-Item $wranglerPath ($wranglerPath + ".bak") -Force
  Set-Content -Path $wranglerPath -Value $patched -Encoding UTF8
  Write-Host "Inserted d1_databases block. Backup written to wrangler.jsonc.bak"
}

Write-Section "Verify D1 exists in account"
& npx wrangler d1 list | Out-Host

Write-Section "Run migrations (LOCAL)"
& npx wrangler d1 execute $DbName --local --file=$migrationPath | Out-Host

Write-Section "Run migrations (REMOTE)"
& npx wrangler d1 execute $DbName --remote --file=$migrationPath | Out-Host

Write-Section "Verify tables (REMOTE)"
$tablesRemote = & npx wrangler d1 execute $DbName --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
$tablesRemote | Out-Host

# Collect required values
if (-not $PtOwnerEmail) { $PtOwnerEmail = Read-Host "Enter PT owner email (for magic link login)" }

# Workspace + user IDs
$workspaceId = $env:WORKSPACE_ID
if (-not $workspaceId) { $workspaceId = [guid]::NewGuid().ToString() }

$ptUserId = [guid]::NewGuid().ToString()

# Secrets: only generated if not already set in current shell
$authSecret = $env:AUTH_TOKEN_SECRET
if (-not $authSecret) { $authSecret = New-RandomUrlSafeToken 48 }

$sessionSecret = $env:SESSION_SECRET
if (-not $sessionSecret) { $sessionSecret = New-RandomUrlSafeToken 48 }

Write-Section "Seed workspace + PT owner user (REMOTE, idempotent)"
$seedSql = @"
INSERT OR IGNORE INTO workspaces (id, name, slug, created_at)
VALUES ('$workspaceId', '$WorkspaceName', '$WorkspaceSlug', datetime('now'));

INSERT OR IGNORE INTO pt_users (id, workspace_id, email, name, role, created_at)
VALUES ('$ptUserId', '$workspaceId', '$PtOwnerEmail', '$PtOwnerName', 'OWNER', datetime('now'));
"@

& npx wrangler d1 execute $DbName --remote --command $seedSql | Out-Host

Write-Section "Verify seed (REMOTE)"
& npx wrangler d1 execute $DbName --remote --command "SELECT id, slug, name FROM workspaces;" | Out-Host
& npx wrangler d1 execute $DbName --remote --command "SELECT email, role, workspace_id FROM pt_users;" | Out-Host

# Optional: configure Pages via API (env vars + D1 binding)
if ($ConfigurePagesViaApi) {
  Write-Section "Configure Pages via API (env vars + D1 binding)"

  if (-not $CloudflareApiToken) { $CloudflareApiToken = $env:CLOUDFLARE_API_TOKEN }
  if (-not $CloudflareApiToken) {
    throw "ConfigurePagesViaApi requested, but no token provided. Set `$env:CLOUDFLARE_API_TOKEN or pass -CloudflareApiToken."
  }

  # Try to derive account_id via wrangler whoami
  $accountId = $env:CF_ACCOUNT_ID
  if (-not $accountId) {
    $whoami = & npx wrangler whoami 2>$null
    $whoamiText = ($whoami | Out-String)
    $m = [regex]::Match($whoamiText, "Account ID:\s*([a-f0-9]{32})", "IgnoreCase")
    if ($m.Success) { $accountId = $m.Groups[1].Value }
  }
  if (-not $accountId) {
    $accountId = Read-Host "Enter Cloudflare Account ID (32 hex chars)"
  }

  $headers = @{
    "Authorization" = "Bearer $CloudflareApiToken"
    "Content-Type"  = "application/json"
  }

  $base = "https://api.cloudflare.com/client/v4"
  $getUrl = "$base/accounts/$accountId/pages/projects/$PagesProjectName"

  $current = Invoke-RestMethod -Method Get -Uri $getUrl -Headers $headers
  if (-not $current.success) { throw "Failed to fetch Pages project. $(($current.errors | ConvertTo-Json -Compress))" }

  $cfg = $current.result.deployment_configs

  # Helper to merge env vars without deleting existing ones
  function Merge-EnvVars($existing, $toAdd) {
    if (-not $existing) { $existing = @{} }
    foreach ($k in $toAdd.Keys) { $existing[$k] = $toAdd[$k] }
    return $existing
  }

  $envVarsToSet = @{
    "WORKSPACE_ID"      = @{ type = "plain_text"; value = $workspaceId }
    "WORKSPACE_SLUG"    = @{ type = "plain_text"; value = $WorkspaceSlug }
    "AUTH_TOKEN_SECRET" = @{ type = "plain_text"; value = $authSecret }
    "SESSION_SECRET"    = @{ type = "plain_text"; value = $sessionSecret }
  }

  # Preserve existing deployment_configs and just merge our keys
  foreach ($envName in @("preview","production")) {
    if (-not $cfg.$envName) { $cfg | Add-Member -NotePropertyName $envName -NotePropertyValue (@{}) }
    if (-not $cfg.$envName.env_vars) { $cfg.$envName | Add-Member -NotePropertyName env_vars -NotePropertyValue (@{}) }
    $cfg.$envName.env_vars = Merge-EnvVars $cfg.$envName.env_vars $envVarsToSet

    # Ensure D1 binding DB points at our database id
    if (-not $cfg.$envName.d1_databases) { $cfg.$envName | Add-Member -NotePropertyName d1_databases -NotePropertyValue (@{}) }
    $cfg.$envName.d1_databases.DB = @{ id = $DbId }
  }

  $patchBody = @{
    deployment_configs = $cfg
  } | ConvertTo-Json -Depth 20

  $patchUrl = $getUrl
  $patched = Invoke-RestMethod -Method Patch -Uri $patchUrl -Headers $headers -Body $patchBody
  if (-not $patched.success) { throw "Failed to patch Pages project. $(($patched.errors | ConvertTo-Json -Compress))" }

  Write-Host "Pages project patched: env vars merged + D1 binding DB set."
  $recheck = Invoke-RestMethod -Method Get -Uri $getUrl -Headers $headers
  $recheck.result.deployment_configs.production.d1_databases | ConvertTo-Json -Depth 10 | Out-Host
}

Write-Section "Final verification queries (REMOTE)"
& npx wrangler d1 execute $DbName --remote --command "SELECT COUNT(*) AS leads_count FROM leads;" | Out-Host
& npx wrangler d1 execute $DbName --remote --command "SELECT COUNT(*) AS uploads_count FROM uploads;" | Out-Host

Write-Section "TOKEN BLOCK (paste back if needed, no secrets shown)"
Write-Host "REPO=$RepoRoot"
Write-Host "DB_NAME=$DbName"
Write-Host "DB_ID=$DbId"
Write-Host "WORKSPACE_ID=$workspaceId"
Write-Host "WORKSPACE_SLUG=$WorkspaceSlug"
Write-Host "PT_OWNER_EMAIL=$PtOwnerEmail"
Write-Host "AUTH_TOKEN_SECRET=$(Mask $authSecret)"
Write-Host "SESSION_SECRET=$(Mask $sessionSecret)"
Write-Host "WRANGLER_JSONC_PATCHED=$(Test-Path ($wranglerPath + '.bak'))"
Write-Host "CONFIGURE_PAGES_VIA_API=$($ConfigurePagesViaApi.IsPresent)"
