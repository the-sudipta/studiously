# ------------ Builder ------------
FROM node:18-alpine AS builder
WORKDIR /app
# Install OS deps if needed (openssl is already in alpine)
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ------------ Runner ------------
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production       PORT=3000
# Only prod deps
COPY package*.json ./
RUN npm ci --omit=dev
# Copy built files
COPY --from=builder /app/dist ./dist
# Copy runtime assets (if any)
# COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "dist/main.js"]
