#!/bin/bash

# Import Custom Theme to Tujjar
# Usage: ./import.sh [API_URL] [TOKEN]

API_URL="${1:-http://localhost:8000}"
TOKEN="${2:-}"

if [ -z "$TOKEN" ]; then
  echo "Error: Please provide your API token"
  echo "Usage: ./import.sh [API_URL] [TOKEN]"
  echo ""
  echo "To get a token, login and check your browser's network tab for the Authorization header."
  exit 1
fi

echo "Importing Sunset Glow theme..."

# Import theme
RESPONSE=$(curl -s -X POST "$API_URL/api/v1/themes/import/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @theme.json)

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "Theme imported successfully!"
echo ""
echo "Next steps:"
echo "1. Go to Dashboard → Themes"
echo "2. Find 'Sunset Glow' in your themes"
echo "3. Click 'Apply to Store' to use it"
echo "4. Or customize it further in the theme editor"
