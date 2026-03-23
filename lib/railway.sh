#!/bin/bash
# MEGA-MD Railway One-Click Deployer
# Usage: bash <(curl -s https://raw.githubusercontent.com/Abdul Rehman RajpootInfo/MEGA-MDX/main/lib/railway.sh)

set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—"
echo "â•‘       MEGA-MD Railway Deployer        â•‘"
echo "â•‘          by Abdul Rehman RajpootInfo            â•‘"
echo "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•"
echo -e "${NC}"

# Install railway CLI if not present
if ! command -v railway &>/dev/null; then
    echo -e "${YELLOW}ðŸ“¦ Installing Railway CLI...${NC}"
    curl -fsSL https://railway.app/install.sh | sh
    export PATH="$HOME/.railway/bin:$PATH"
fi

# Check login
if ! railway whoami &>/dev/null; then
    echo -e "${YELLOW}ðŸ”‘ Please login to Railway:${NC}"
    railway login
fi

echo ""
echo -e "${BOLD}ðŸ“‹ Enter your bot details:${NC}"
echo ""

read -p "$(echo -e ${CYAN}Session ID (Abdul Rehman RajpootInfo/MEGA-MD_xxxxx): ${NC})" SESSION_ID
if [ -z "$SESSION_ID" ]; then
    echo -e "${RED}âŒ Session ID is required!${NC}"
    exit 1
fi

read -p "$(echo -e ${CYAN}Owner WhatsApp number (e.g. 923001234567): ${NC})" OWNER_NUMBER
OWNER_NUMBER=${OWNER_NUMBER:-923000000000}

read -p "$(echo -e ${CYAN}Bot name (default: MEGA-MD): ${NC})" BOT_NAME
BOT_NAME=${BOT_NAME:-MEGA-MD}

read -p "$(echo -e ${CYAN}MongoDB URL (recommended, press Enter to skip): ${NC})" MONGO_URL

read -p "$(echo -e ${CYAN}Timezone (default: Asia/Karachi): ${NC})" TIMEZONE
TIMEZONE=${TIMEZONE:-Asia/Karachi}

echo ""
echo -e "${YELLOW}ðŸš€ Starting deployment...${NC}"
echo ""

# Clone if not in repo
if [ ! -f "railway.json" ]; then
    echo -e "${YELLOW}ðŸ“¦ Cloning MEGA-MD repo...${NC}"
    git clone https://github.com/Abdul Rehman RajpootInfo/MEGA-MDX mega-md-deploy
    cd mega-md-deploy
fi

# Init railway project
echo -e "${YELLOW}ðŸ“± Creating Railway project...${NC}"
railway init --name "mega-md-bot"

# Set environment variables
echo -e "${YELLOW}âš™ï¸ Setting environment variables...${NC}"
railway variables set \
    SESSION_ID="$SESSION_ID" \
    OWNER_NUMBER="$OWNER_NUMBER" \
    BOT_NAME="$BOT_NAME" \
    TIMEZONE="$TIMEZONE" \
    COMMAND_MODE="public"

[ -n "$MONGO_URL" ] && railway variables set MONGO_URL="$MONGO_URL"

# Deploy
echo -e "${YELLOW}ðŸ“¤ Deploying to Railway (this may take 3-5 minutes)...${NC}"
railway up --detach

echo ""
echo -e "${GREEN}â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—${NC}"
echo -e "${GREEN}â•‘        âœ… Deployment Complete!        â•‘${NC}"
echo -e "${GREEN}â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
echo ""
echo -e "${BOLD}Logs:${NC}    railway logs"
echo -e "${BOLD}Status:${NC}  railway status"
echo -e "${BOLD}Open:${NC}    railway open"
echo ""
echo -e "${CYAN}ðŸ“± Scan QR or use Session ID to connect your WhatsApp!${NC}"
