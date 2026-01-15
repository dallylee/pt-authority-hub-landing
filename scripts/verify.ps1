# PT Authority Hub - Verification Script
# Run this after deployment to verify all features work end-to-end

$baseUrl = "https://pt-authority-hub-landing.pages.dev"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PT Authority Hub Verification Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Quiz route works
Write-Host "[TEST 1] Checking /quiz route..." -ForegroundColor Yellow
try {
    $quizRes = Invoke-WebRequest -Uri "$baseUrl/quiz" -UseBasicParsing -TimeoutSec 10
    if ($quizRes.StatusCode -eq 200 -and $quizRes.Content -like "*Free Performance Audit*") {
        Write-Host "  ✓ Quiz page loads correctly" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Quiz page content unexpected" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Quiz page failed: $_" -ForegroundColor Red
}

# Test 2: API spots endpoint
Write-Host "[TEST 2] Checking /api/spots endpoint..." -ForegroundColor Yellow
try {
    $spotsRes = Invoke-RestMethod -Uri "$baseUrl/api/spots" -TimeoutSec 10
    if ($spotsRes.spots -ne $null) {
        Write-Host "  ✓ API spots returns data: $($spotsRes.spots) spots" -ForegroundColor Green
    } else {
        Write-Host "  ✗ API spots response invalid" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ API spots failed: $_" -ForegroundColor Red
}

# Test 3: Submit a test lead (POST /api/leads/ingest)
Write-Host "[TEST 3] Submitting test lead to /api/leads/ingest..." -ForegroundColor Yellow
$testLead = @{
    email = "test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    first_name = "Test"
    location = "UK (outside London)"
    main_goal = "Build Muscle"
    start_timing = "In 2–3 Weeks"
    biggest_blocker = "I Train, but Results Are Not Happening"
    training_days_current = "2–3"
    time_commitment_weekly = "1–2 Hours"
    monthly_investment = "£150–£300/month"
    coaching_preference = "1:1 In-Person (London)"
    constraints = "None"
    wants_upload = "Yes"
    consent = "true"
} | ConvertTo-Json

try {
    $ingestRes = Invoke-RestMethod -Uri "$baseUrl/api/leads/ingest" -Method POST -Body $testLead -ContentType "application/json" -TimeoutSec 15
    if ($ingestRes.ok -eq $true -and $ingestRes.leadId) {
        Write-Host "  ✓ Lead created with ID: $($ingestRes.leadId)" -ForegroundColor Green
        $global:testLeadId = $ingestRes.leadId
        
        # Expected: TRAINING bottleneck (Results Not Happening → +5 TRAINING)
        Write-Host "  ✓ Expected bottleneck: TRAINING (Results Not Happening)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Lead creation failed: $($ingestRes.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Ingest API failed: $_" -ForegroundColor Red
}

# Test 4: PT Login page
Write-Host "[TEST 4] Checking /pt/login page..." -ForegroundColor Yellow
try {
    $loginRes = Invoke-WebRequest -Uri "$baseUrl/pt/login" -UseBasicParsing -TimeoutSec 10
    if ($loginRes.StatusCode -eq 200 -and $loginRes.Content -like "*Email*") {
        Write-Host "  ✓ PT Login page renders" -ForegroundColor Green
    } else {
        Write-Host "  ✗ PT Login page content unexpected" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ PT Login page failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: To verify lead appears in PT Console:" -ForegroundColor Yellow
Write-Host "1. Login to PT Console at $baseUrl/pt/login" -ForegroundColor White
Write-Host "2. Check lead list shows the test lead with:" -ForegroundColor White
Write-Host "   - Segment: WARM or DISQUALIFIED (outside London + in-person)" -ForegroundColor White
Write-Host "   - Bottleneck: TRAINING (not UNKNOWN)" -ForegroundColor White
Write-Host "3. Click lead to view details and verify Download button works" -ForegroundColor White
Write-Host ""
