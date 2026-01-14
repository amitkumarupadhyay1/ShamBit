# CI/CD Pipeline Local Test Script (PowerShell)
# This simulates what GitHub Actions will do

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "CI/CD Pipeline Local Test" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Change to api-nestjs directory
Set-Location api-nestjs

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Stage 1: Test & Lint" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "→ Installing dependencies..." -ForegroundColor Yellow
npm ci
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "→ Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "→ Running tests..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ All tests passed" -ForegroundColor Green
} else {
    Write-Host "✗ Tests failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "→ Running tests with coverage..." -ForegroundColor Yellow
npm run test:cov
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Coverage report generated" -ForegroundColor Green
} else {
    Write-Host "✗ Coverage generation failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Stage 2: Build Application" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "→ Building application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Build successful" -ForegroundColor Green
} else {
    Write-Host "✗ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "→ Checking build artifacts..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Write-Host "✓ Build artifacts created" -ForegroundColor Green
    Write-Host "  Files in dist:"
    Get-ChildItem dist | Select-Object -First 10 | Format-Table Name, Length
} else {
    Write-Host "✗ Build artifacts not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Stage 3: Security Scan" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "→ Running npm audit..." -ForegroundColor Yellow
npm audit --audit-level=moderate
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Some vulnerabilities found (non-blocking)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Pipeline Test Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✓ All stages completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Your CI/CD pipeline is ready to use."
Write-Host "Push to GitHub to trigger the actual pipeline."
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Set up GitHub secrets (see CI_CD_SETUP_GUIDE.md)"
Write-Host "2. Push to 'develop' branch to test staging deployment"
Write-Host "3. Push to 'main' branch for production deployment"
Write-Host ""

Set-Location ..
