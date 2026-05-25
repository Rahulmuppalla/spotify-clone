#!/bin/bash

# Terminate background processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM

echo "==================================================="
echo "  Spotify Clone - WSL/Ubuntu Local Startup Script"
echo "==================================================="
echo ""

# 1. Check for node
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please run: sudo apt install nodejs npm"
    exit 1
fi

# 2. Run backend
echo "Starting Express Backend..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi
npm run dev &
BACKEND_PID=$!

# 3. Run frontend
cd ../frontend
echo "Starting Vite Frontend..."
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!

echo ""
echo "==================================================="
echo "  Both services are running in background!"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:5000"
echo "  Press [CTRL+C] to stop both servers."
echo "==================================================="
echo ""

# Wait for both background processes
wait
