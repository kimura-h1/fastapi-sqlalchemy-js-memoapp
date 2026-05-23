#!/bin/bash

set -e

IMAGE=632752099901.dkr.ecr.ap-northeast-1.amazonaws.com/memo-fastapi-dev:latest

echo "🚀 build..."
docker build -t memo-fastapi-dev .

echo "🏷 tag..."
docker tag memo-fastapi-dev:latest $IMAGE

echo "📦 push..."
docker push $IMAGE

echo "🔄 deploy..."
aws ecs update-service \
  --cluster memo-fastapi-cluster \
  --service memo-fastapi-service \
  --force-new-deployment

echo "✅ done"
