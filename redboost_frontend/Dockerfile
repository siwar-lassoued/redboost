# ─── Stage 1: Build Angular ───────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --quiet

# Copy source
COPY . .

# Build argument for API URL (overridden at build time)
ARG API_URL=http://localhost:8082

# Replace API URL in environment file before build
RUN sed -i "s|http://localhost:8082|${API_URL}|g" src/environment.ts 2>/dev/null || true

# Production build
RUN npm run build -- --configuration production

# ─── Stage 2: Nginx serving ───────────────────────────────────────────────────
FROM nginx:1.25-alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built Angular app
COPY --from=builder /app/dist/sakai-ng/browser /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
