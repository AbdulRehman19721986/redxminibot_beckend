FROM node:20-slim

# Install system dependencies needed by Baileys / canvas / sharp
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ffmpeg \
    python3 \
    make \
    g++ \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (cache layer)
COPY package.json ./

# Install dependencies
RUN npm install --omit=dev --no-audit --no-fund --legacy-peer-deps

# Copy all source files
COPY . .

# Create required directories
RUN mkdir -p sessions data plugins public

# Expose port
EXPOSE 3000

# Health check — Railway polls /health every 30s
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start bot
CMD ["node", "index.js"]
