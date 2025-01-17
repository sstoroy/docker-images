#!/bin/bash
cd "$(dirname "$0")"

if [ -z "$(docker --version 2> /dev/null)" ]; then
    echo "Docker not installed! Aborting..."
    exit 1
fi

if [ -z "$(docker build -t {{ filename }} . )" ]; then
    echo "Failed to build image! Aborting..."
    exit 1
fi

docker run -p 8080:8080 {{ filename }}