#!/bin/bash
# Script to install swisseph package with nvm loaded

# Try to load NVM from common locations
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
elif [ -s "/usr/local/share/nvm/nvm.sh" ]; then
    source "/usr/local/share/nvm/nvm.sh"
elif [ -s "/opt/nvm/nvm.sh" ]; then
    source "/opt/nvm/nvm.sh"
fi

# Also check for Node.js in user directory
if [ -d "$HOME/.nvm/versions/node" ]; then
    NODE_PATH=$(find "$HOME/.nvm/versions/node" -name "node" -type f | head -1)
    if [ -n "$NODE_PATH" ]; then
        NODE_DIR=$(dirname "$NODE_PATH")
        export PATH="$NODE_DIR:$PATH"
        echo "Found Node.js at: $NODE_PATH"
    fi
fi

# Check if npm is available
if command -v npm &> /dev/null; then
    echo "Using Node.js version: $(node --version)"
    echo "Using npm version: $(npm --version)"
    echo "Installing swisseph package..."
    
    # Install swisseph
    npm install swisseph@^0.5.16
    
    if [ $? -eq 0 ]; then
        echo "✅ swisseph installed successfully!"
        echo ""
        echo "To verify installation, run:"
        echo "npm list swisseph"
        echo ""
        echo "To test the setup, run:"
        echo "npx ts-node test-swiss-ephemeris-setup.ts"
    else
        echo "❌ Failed to install swisseph"
        exit 1
    fi
else
    echo "Error: npm not found. Please install Node.js and npm."
    echo "Visit: https://nodejs.org/"
    exit 1
fi