#!/bin/bash

# CI/CD Pipeline Local Test Script
# This simulates what GitHub Actions will do

set -e  # Exit on error

echo "=========================================="
echo "CI/CD Pipeline Local Test"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to api-nestjs directory
cd api-nestjs

echo "=========================================="
echo "Stage 1: Test & Lint"
echo "=========================================="

echo -e "${YELLOW}→ Installing dependencies...${NC}"
npm ci
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}→ Generating Prisma Client...${NC}"
npx prisma generate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Prisma Client generated${NC}"
else
    echo -e "${RED}✗ Failed to generate Prisma Client${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}→ Running tests...${NC}"
npm test
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed${NC}"
else
    echo -e "${RED}✗ Tests failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}→ Running tests with coverage...${NC}"
npm run test:cov
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Coverage report generated${NC}"
else
    echo -e "${RED}✗ Coverage generation failed${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo "Stage 2: Build Application"
echo "=========================================="

echo -e "${YELLOW}→ Building application...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}→ Checking build artifacts...${NC}"
if [ -d "dist" ]; then
    echo -e "${GREEN}✓ Build artifacts created${NC}"
    echo "  Files in dist:"
    ls -la dist | head -10
else
    echo -e "${RED}✗ Build artifacts not found${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo "Stage 3: Security Scan"
echo "=========================================="

echo -e "${YELLOW}→ Running npm audit...${NC}"
npm audit --audit-level=moderate || echo -e "${YELLOW}⚠ Some vulnerabilities found (non-blocking)${NC}"

echo ""
echo "=========================================="
echo "Pipeline Test Summary"
echo "=========================================="
echo -e "${GREEN}✓ All stages completed successfully!${NC}"
echo ""
echo "Your CI/CD pipeline is ready to use."
echo "Push to GitHub to trigger the actual pipeline."
echo ""
echo "Next steps:"
echo "1. Set up GitHub secrets (see CI_CD_SETUP_GUIDE.md)"
echo "2. Push to 'develop' branch to test staging deployment"
echo "3. Push to 'main' branch for production deployment"
echo ""
