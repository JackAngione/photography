#!/bin/bash
# Build script for deploying backend to TrueNas Server
# Backend must be built before containerizing

VERSION_TAG="v1.0.0"

set -e  # Exit on error

#go out of /production to main folder
cd ..

# Load environment variables from .env
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

echo "Building Rust binary for x86_64-unknown-linux-musl..."
#cross build --release --target x86_64-unknown-linux-musl

echo "Stripping binary..."
strip ./backend/target/x86_64-unknown-linux-musl/release/photography_backend || echo "Strip failed, continuing..."

cd backend
echo "Building Docker image..."
docker build -t registry.gitlab.com/8jk.ang8/photography/backend:$VERSION_TAG . #--platform linux/amd64

echo "Done! Image size:"
docker images registry.gitlab.com/8jk.ang8/photography/backend:$VERSION_TAG

#GITLAB REGISTRY STUFF
echo "Pushing Docker image to GitLab Registry..."
docker login registry.gitlab.com --username=$GITLAB_USERNAME --password=$GITLAB_PASSWORD

echo "Pushing Docker image to GitLab Registry..."
docker push registry.gitlab.com/8jk.ang8/photography/backend:$VERSION_TAG
##

echo "To run: docker run registry.gitlab.com/8jk.ang8/photography/backend:$VERSION_TAG"