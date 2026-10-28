# Multi-stage build for Vite React app

FROM node:22-alpine AS builder
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
WORKDIR /app
# pnpm en la versión de "packageManager" de package.json
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM nginx:stable-alpine AS runner
RUN apk add --no-cache gettext
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy runtime env template and entrypoint
COPY public/env.template.js /usr/share/nginx/html/env.template.js
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
# Simple default nginx config suitable for single-page apps
RUN printf '%s\n' \
    'server {' \
    '  listen       80;' \
    '  server_name  _;' \
    '  root   /usr/share/nginx/html;' \
    '  index  index.html;' \
    '  location / {' \
    '    try_files $uri /index.html;' \
    '  }' \
    '}' \
    > /etc/nginx/conf.d/default.conf
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
