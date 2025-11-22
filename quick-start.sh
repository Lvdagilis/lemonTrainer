#!/bin/bash

echo "🍋 lemonTrainer Quick Start"
echo "==========================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Build and start the container
echo "🔨 Building and starting lemonTrainer..."
echo ""

if command -v docker-compose &> /dev/null; then
    docker-compose up -d --build
else
    docker compose up -d --build
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ lemonTrainer is now running!"
    echo ""
    echo "📱 Access the app at:"
    echo "   https://localhost:3000"
    echo ""
    echo "🌐 To access from other devices on your network:"
    echo "   1. Find your computer's IP address"
    echo "      - macOS/Linux: ifconfig | grep 'inet '"
    echo "      - Windows: ipconfig"
    echo "   2. Access https://<your-ip>:3000 from your phone/tablet"
    echo ""
    echo "⚠️  Note: You'll need to accept the self-signed certificate warning"
    echo ""
    echo "📋 Useful commands:"
    echo "   - View logs: docker logs lemontrainer"
    echo "   - Stop app: docker-compose down"
    echo "   - Restart: docker-compose restart"
else
    echo "❌ Failed to start lemonTrainer"
    exit 1
fi
