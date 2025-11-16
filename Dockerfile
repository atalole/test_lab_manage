FROM node:22-bookworm AS builder


WORKDIR /app

# Install OpenSSL (required by Prisma)
RUN apt-get update && apt-get install -y openssl


# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source files
COPY . .


# # Generate Prisma Client
# RUN npx prisma generate


# Build TypeScript
RUN npm run build


# Production stage
FROM node:22-bookworm AS runner

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/


# Install production dependencies only (omit dev deps and skip lifecycle scripts like prepare)
# `prepare` runs husky install which expects husky to be installed (devDependency).
# Skip scripts so the production install doesn't fail because husky is not present.
RUN npm ci --omit=dev --ignore-scripts

# Regenerate prisma client again (important)
RUN npx prisma generate

# Copy built files
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/server.js"]
