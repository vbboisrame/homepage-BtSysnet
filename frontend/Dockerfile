# ── Étape 1 : build Angular ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Étape 2 : serveur Nginx pour servir les fichiers statiques ──
FROM nginx:alpine
COPY --from=builder /app/dist/proxima-frontend/browser /usr/share/nginx/html

# Configuration Nginx pour le routing Angular (SPA)
# Sans ça, un F5 sur /diagram renverrait une 404
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
