# Build stage
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install openssl for Prisma runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies needed for tsc)
RUN npm ci --include=dev

COPY . .

# Generate Prisma client and compile TypeScript
RUN npx prisma generate && npm run build

# Production runtime stage
FROM node:22-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3010

COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled app and generated prisma client from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3010

CMD ["node", "dist/server.js"]