FROM node:20-slim

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

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund --legacy-peer-deps

COPY . .

RUN mkdir -p session temp data plugins public

EXPOSE 3000

# Healthcheck – give the bot plenty of time to start (2 minutes)
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "index.js"]
