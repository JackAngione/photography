#!/bin/bash
# Build script for deploying to TrueNas Server

set -e  # Exit on error

#go out of /production to main folder
cd ..

# Load environment variables from .env
if [ -f .env.production ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

echo "Building Rust backend for x86_64-unknown-linux-musl..."
#starts in /production
cd backend
#cargo build --release --target x86_64-unknown-linux-musl
cross build --release --target x86_64-unknown-linux-musl



