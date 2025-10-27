# Stage 1: Build the app
# Use an official Node.js image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma/
# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the source code and build TypeScript
COPY . .
RUN npm run build

# Prune development dependencies
RUN npm prune --production

# Stage 2: Create the final production image
FROM node:18-alpine

WORKDIR /app

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules
# Copy built app
COPY --from=builder /app/dist ./dist
# Copy Prisma schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Expose the port
EXPOSE 4000

# Command to run the app
# We'll run migrations first, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]