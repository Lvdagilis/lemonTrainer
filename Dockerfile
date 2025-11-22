# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy server script
COPY server.js ./

# Copy SSL certificate generation script
COPY setup-ssl.sh ./

# Create certs directory
RUN mkdir -p certs

# Install OpenSSL for certificate generation
RUN apk add --no-cache openssl

# Generate self-signed SSL certificates
RUN /bin/sh setup-ssl.sh

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
