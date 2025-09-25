#!/usr/bin/env sh
set -e

# Generate /usr/share/nginx/html/env.js from template using container env vars
TEMPLATE="/usr/share/nginx/html/env.template.js"
OUTPUT="/usr/share/nginx/html/env.js"

# Copy template from public if present
if [ -f "/usr/share/nginx/html/env.template.js" ]; then
  :
elif [ -f "/app/public/env.template.js" ]; then
  cp /app/public/env.template.js "$TEMPLATE"
fi

if [ -f "$TEMPLATE" ]; then
  # Default values if not provided
  # : "${VITE_TENANT_HEADER:=X-Tenant-ID}"
  : "${VITE_API_URL:=${PUBLIC_VITE_API_URL:-}}"
  # Use envsubst to substitute variables
  echo "Generating runtime env at $OUTPUT"
  envsubst '$VITE_API_URL,$VITE_TENANT_HEADER' < "$TEMPLATE" > "$OUTPUT"
else
  echo "No env.template.js found; skipping runtime env generation"
fi

exec nginx -g 'daemon off;'

