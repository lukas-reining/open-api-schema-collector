#!/bin/bash
docker buildx build \
  --platform linux/arm/v7,linux/arm64/v8,linux/amd64 \
  --pull --push -t lukasreining/open-api-schema-collector:"$1" \
  -t lukasreining/open-api-schema-collector:latest .
