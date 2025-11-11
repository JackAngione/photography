#!/bin/bash
# Script for deploying frontend to TrueNas Server
# NextJS project is built inside the docker container

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

#docker image fails to build if package.lock is not proper
echo "Running npm install to make sure dependencies are prepared"
npm install

echo "Building Docker image..."
docker build -t registry.gitlab.com/8jk.ang8/photography/frontend:$VERSION_TAG . #--platform linux/amd64

echo "Done! Image size:"
docker images registry.gitlab.com/8jk.ang8/photography/frontend:$VERSION_TAG

#GITLAB REGISTRY STUFF
echo "Pushing Docker image to GitLab Registry..."
docker login registry.gitlab.com --username="$GITLAB_USERNAME" --password="$GITLAB_PASSWORD"

echo "Pushing Docker image to GitLab Registry..."
docker push registry.gitlab.com/8jk.ang8/photography/frontend:$VERSION_TAG
##

echo "To run: docker run registry.gitlab.com/8jk.ang8/photography/backend:$VERSION_TAG"