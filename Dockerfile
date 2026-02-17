# Build stage
FROM oven/bun:1-alpine AS builder

# Install runtime dependencies for native modules
RUN apk add --no-cache make g++

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Migration stage (includes devDependencies for drizzle-kit)
FROM oven/bun:1-alpine AS migration

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install ALL dependencies (including devDependencies)
RUN bun install --frozen-lockfile

# Copy source files and migrations
COPY drizzle ./drizzle
COPY drizzle.config.js ./
COPY src ./src

# Production stage
FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock

# Install production dependencies (needed for runtime)
RUN bun install --production --frozen-lockfile --ignore-scripts

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=3000

# Start the Bun server directly from built output
CMD ["bun", "run", "./dist/server/entry.mjs"]
