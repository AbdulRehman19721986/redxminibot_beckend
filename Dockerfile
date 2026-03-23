FROM node:20-slim

# Install required system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ffmpeg \
    python3 \
    python3-pip \
    make \
    g++ \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for layer caching
COPY package.json ./

# Install dependencies (ignore dev dependencies)
RUN npm install --omit=dev --no-audit --no-fund --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Create required runtime directories
RUN mkdir -p session temp data plugins public

# Expose the port
EXPOSE 3000

# Healthcheck – give the bot plenty of time to start (2 minutes)
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the bot
CMD ["node", "index.js"]
