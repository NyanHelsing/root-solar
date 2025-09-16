# syntax=docker/dockerfile:1.7

############################################
# Stage 1: set up pnpm
############################################
FROM node:24-bookworm-slim
WORKDIR /app

# Copy manifest(s) first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./


ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack install

# Tools required to build native modules (e.g., better-sqlite3/sqlite3) if needed
# Remove these from final image via multi-stage build.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    pkg-config \
    sqlite3 \
    libsqlite3-dev \
    ca-certificates \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Install only production deps; fall back to npm i if lockfile is missing
#RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm i --frozen-lockfile
RUN pnpm i --frozen-lockfile

# Environment
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/data/app.sqlite

# Create persistent data dir and set permissions for the non-root "node" user
RUN mkdir -p /data \
    && chown -R node:node /data /app

# Copy node_modules from deps stage, then your app code
#COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .

# Expose your app port and declare a volume for the SQLite file
EXPOSE 3000
VOLUME ["/data"]

# Drop privileges and use dumb-init for proper signal handling
USER node
RUN corepack enable && corepack install
ENTRYPOINT ["dumb-init", "--"]

# Start your server (ensure package.json has: "start": "node server.js" or similar)
CMD ["pnpm", "start"]
