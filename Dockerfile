# Multi-stage build for Vite React app

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
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
CMD ["nginx", "-g", "daemon off;"]

