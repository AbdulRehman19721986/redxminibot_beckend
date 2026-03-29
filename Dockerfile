FROM node:20-slim

# Install system dependencies including ffmpeg properly
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    imagemagick \
    webp \
    git \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Verify ffmpeg works
RUN ffmpeg -version && echo "✅ ffmpeg OK"

WORKDIR /app

# Copy package.json first for layer caching
COPY package.json ./

# Remove ffmpeg-static from package.json (we use system ffmpeg)
RUN node -e "
const pkg = JSON.parse(require('fs').readFileSync('package.json','utf8'));
delete pkg.dependencies['ffmpeg-static'];
delete pkg.dependencies['@ffmpeg-installer/ffmpeg'];
require('fs').writeFileSync('package.json', JSON.stringify(pkg,null,2));
console.log('package.json cleaned');
"

# Set ffmpeg path to system binary
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV FFMPEG_SKIP_INSTALL=1
ENV PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ENV NODE_ENV=production

# Install Node deps
RUN npm install --force --no-package-lock --no-audit --no-fund --loglevel=error \
    && npm cache clean --force

# Copy source
COPY . .

# Create temp dirs
RUN mkdir -p temp tmp data session

EXPOSE 3000

# Start with memory limits optimized for Heroku 512MB dyno
CMD ["node", "--max-old-space-size=460", "--optimize-for-size", "--expose-gc", "index.js"]
