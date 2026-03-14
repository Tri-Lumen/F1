FROM node:22-alpine AS base

LABEL org.opencontainers.image.source="https://github.com/Tri-Lumen/F1"
LABEL org.opencontainers.image.description="F1 Dashboard"
LABEL org.opencontainers.image.licenses="MIT"

# --- Dependencies ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure .git exists for the runtime self-update feature.
# When the build context does not include .git (e.g. Docker stack deploy),
# initialise a repo with the remote from package.json so git pull works at runtime.
RUN apk add --no-cache git && \
    export GIT_TERMINAL_PROMPT=0 && \
    if [ ! -d .git ]; then \
      git init && \
      git remote add origin "$(node -e "process.stdout.write(require('./package.json').repository.url)")" && \
      git fetch origin main && \
      git reset --mixed origin/main ; \
    fi

RUN npm run build

# --- Production ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV GIT_TERMINAL_PROMPT=0

# git is needed for the in-app self-update feature
RUN apk add --no-cache git

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Fix git "dubious ownership" error: /app is created by WORKDIR as root,
# but the container runs as nextjs. Git 2.35.2+ rejects repos where the
# directory owner doesn't match the current user.
RUN chown nextjs:nodejs /app

COPY --from=builder /app/public ./public

# Copy the full source + .git so the update API can git pull & rebuild
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.git ./.git
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json* ./

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
