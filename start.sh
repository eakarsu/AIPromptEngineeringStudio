#!/bin/bash

# ============================================
# AI Prompt Engineering Studio - Startup Script
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project root
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════╗"
echo "║     AI Prompt Engineering Studio                 ║"
echo "║     Starting Application...                      ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found! Please create one.${NC}"
  exit 1
fi

# ---- Clean up used ports ----
echo -e "\n${YELLOW}▸ Cleaning up ports...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  ${YELLOW}Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  else
    echo -e "  ${GREEN}Port $port is free${NC}"
  fi
}

cleanup_port ${BACKEND_PORT:-3001}
cleanup_port ${FRONTEND_PORT:-3000}

echo -e "${GREEN}✓ Ports cleaned${NC}"

# ---- Check PostgreSQL ----
echo -e "\n${YELLOW}▸ Checking PostgreSQL...${NC}"

if command -v pg_isready &> /dev/null; then
  if pg_isready -q 2>/dev/null; then
    echo -e "  ${GREEN}PostgreSQL is running${NC}"
  else
    echo -e "  ${YELLOW}Starting PostgreSQL...${NC}"
    if command -v brew &> /dev/null; then
      brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    fi
    sleep 2
    if pg_isready -q 2>/dev/null; then
      echo -e "  ${GREEN}PostgreSQL started${NC}"
    else
      echo -e "  ${RED}Could not start PostgreSQL. Please start it manually.${NC}"
      exit 1
    fi
  fi
else
  echo -e "  ${YELLOW}pg_isready not found, assuming PostgreSQL is running${NC}"
fi

# ---- Create Database and User ----
echo -e "\n${YELLOW}▸ Setting up database...${NC}"

# Extract DB details from DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed -n 's|postgresql://\([^:]*\):.*|\1|p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's|postgresql://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's|postgresql://[^@]*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's|postgresql://[^@]*@[^:]*:\([^/]*\)/.*|\1|p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's|postgresql://[^/]*/\(.*\)|\1|p')

# Create user and database if they don't exist
psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $(whoami) -d postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" 2>/dev/null | grep -q 1 || \
  psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $(whoami) -d postgres -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}' CREATEDB;" 2>/dev/null || true

psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $(whoami) -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null | grep -q 1 || \
  psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $(whoami) -d postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null || true

# Grant privileges
psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $(whoami) -d ${DB_NAME} -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};" 2>/dev/null || true
psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $(whoami) -d ${DB_NAME} -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};" 2>/dev/null || true
psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $(whoami) -d ${DB_NAME} -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};" 2>/dev/null || true
psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $(whoami) -d ${DB_NAME} -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};" 2>/dev/null || true

echo -e "${GREEN}✓ Database ready: ${DB_NAME}${NC}"

# ---- Install Dependencies ----
echo -e "\n${YELLOW}▸ Installing backend dependencies...${NC}"
cd "$PROJECT_DIR/backend"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  npm install --silent 2>&1 | tail -1
  echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
  echo -e "${GREEN}✓ Backend dependencies up to date${NC}"
fi

echo -e "\n${YELLOW}▸ Installing frontend dependencies...${NC}"
cd "$PROJECT_DIR/frontend"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  npm install --silent 2>&1 | tail -1
  echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
  echo -e "${GREEN}✓ Frontend dependencies up to date${NC}"
fi

cd "$PROJECT_DIR"

# ---- Seed Database ----
echo -e "\n${YELLOW}▸ Seeding database...${NC}"
cd "$PROJECT_DIR/backend"
node seed.js
echo -e "${GREEN}✓ Database seeded${NC}"

# ---- Start Services ----
echo -e "\n${CYAN}▸ Starting services with hot reload...${NC}"

# Create log directory
mkdir -p "$PROJECT_DIR/logs"

# Start backend with nodemon (hot reload)
cd "$PROJECT_DIR/backend"
npx nodemon server.js > "$PROJECT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo -e "  ${GREEN}✓ Backend started (PID: $BACKEND_PID) on port ${BACKEND_PORT:-3001}${NC}"

# Start frontend with React dev server (hot reload built-in)
cd "$PROJECT_DIR/frontend"
BROWSER=none PORT=${FRONTEND_PORT:-3000} npm start > "$PROJECT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo -e "  ${GREEN}✓ Frontend started (PID: $FRONTEND_PID) on port ${FRONTEND_PORT:-3000}${NC}"

cd "$PROJECT_DIR"

# ---- Save PIDs for cleanup ----
echo "$BACKEND_PID" > "$PROJECT_DIR/.backend.pid"
echo "$FRONTEND_PID" > "$PROJECT_DIR/.frontend.pid"

# ---- Wait for services ----
echo -e "\n${YELLOW}▸ Waiting for services to be ready...${NC}"

wait_for_port() {
  local port=$1
  local name=$2
  local max_attempts=30
  local attempt=0
  while [ $attempt -lt $max_attempts ]; do
    if curl -s "http://localhost:$port" > /dev/null 2>&1 || curl -s "http://localhost:$port/api/health" > /dev/null 2>&1; then
      echo -e "  ${GREEN}✓ $name is ready on port $port${NC}"
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 2
  done
  echo -e "  ${YELLOW}⚠ $name may still be starting on port $port${NC}"
  return 0
}

wait_for_port ${BACKEND_PORT:-3001} "Backend API"
wait_for_port ${FRONTEND_PORT:-3000} "Frontend"

# ---- Print Summary ----
echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║  🚀 AI Prompt Engineering Studio is RUNNING!     ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║                                                  ║"
echo "║  Frontend:  http://localhost:${FRONTEND_PORT:-3000}                ║"
echo "║  Backend:   http://localhost:${BACKEND_PORT:-3001}                ║"
echo "║                                                  ║"
echo "║  Login:     ${DEFAULT_ADMIN_EMAIL:-admin@promptstudio.com}      ║"
echo "║  Password:  ${DEFAULT_ADMIN_PASSWORD:-admin123}                          ║"
echo "║                                                  ║"
echo "║  Logs:      ./logs/backend.log                   ║"
echo "║             ./logs/frontend.log                  ║"
echo "║                                                  ║"
echo "║  Hot reload is enabled - changes auto-refresh!   ║"
echo "║                                                  ║"
echo "║  Press Ctrl+C to stop all services               ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ---- Graceful Shutdown ----
cleanup() {
  echo -e "\n${YELLOW}▸ Shutting down services...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  rm -f "$PROJECT_DIR/.backend.pid" "$PROJECT_DIR/.frontend.pid"
  echo -e "${GREEN}✓ All services stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running and forward logs
tail -f "$PROJECT_DIR/logs/backend.log" "$PROJECT_DIR/logs/frontend.log" 2>/dev/null &

# Wait for background processes
wait
