# ── Stage 1: Builder ──────────────────────────────────────────────────────────
# Installs all deps (including devDeps) and compiles TypeScript → dist/
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first — leverages Docker layer cache on dep installs
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and compile
COPY . .
RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
# Lean production image — no TypeScript, no devDeps, no source files
FROM node:20-alpine AS runner

WORKDIR /app

# Copy manifests and install production deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Run as the built-in non-root "node" user (uid 1000 in node:alpine)
USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]
