#!/bin/bash
# Script to run npm dev with nvm loaded

# Try to load NVM from common locations
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
elif [ -s "/usr/local/share/nvm/nvm.sh" ]; then
    source "/usr/local/share/nvm/nvm.sh"
elif [ -s "/opt/nvm/nvm.sh" ]; then
    source "/opt/nvm/nvm.sh"
else
    echo "NVM not found. Trying to run npm directly..."
fi

# Check if npm is available
if command -v npm &> /dev/null; then
    echo "Using Node.js version: $(node --version)"
    echo "Using npm version: $(npm --version)"
    npm run dev
else
    echo "Error: npm not found. Please install Node.js and npm."
    echo "Visit: https://nodejs.org/"
    exit 1
fi