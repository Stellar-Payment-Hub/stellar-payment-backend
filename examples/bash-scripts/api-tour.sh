#!/usr/bin/env bash
# Stellar Payment Hub - API Tour & Shell Examples
set -e

BASE_URL="${STELLAR_HUB_URL:-http://localhost:3000}"
echo "=== Starting Stellar Payment Hub API Tour at $BASE_URL ==="

echo "1. Health Probe:"
curl -s "$BASE_URL/health" | grep -o '"status":"[^"]*"' || true
echo ""

echo "2. Fee Diagnostics:"
curl -s "$BASE_URL/health/diagnostics" | grep -o '"status":"[^"]*"' || true
echo ""

echo "3. Query Asset Catalog:"
curl -s "$BASE_URL/api/assets" | grep -o '"code":"[^"]*"' || true
echo ""

echo "4. Calculate Zero-Loss Split (100 XLM across 3 recipients):"
curl -s -X POST "$BASE_URL/api/settlements/calculate-split" \
  -H "Content-Type: application/json" \
  -d '{"total_amount":"100.0000","recipients_count":3}'
echo ""

echo "=== API Tour Finished Successfully ==="
