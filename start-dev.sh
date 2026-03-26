#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting Routine Application ===${NC}\n"

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}\n"

# Start all services with Docker Compose
echo -e "${BLUE}Starting services...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "\n${BLUE}Waiting for services to be ready...${NC}"
sleep 10

# Check service status
echo -e "\n${GREEN}=== Service Status ===${NC}"
echo -e "${BLUE}Backend (Spring Boot):${NC} http://localhost:8080"
echo -e "${BLUE}Admin Dashboard:${NC} http://localhost:5173"
echo -e "${BLUE}Storefront:${NC} http://localhost:5174"
echo -e "${BLUE}Database (MySQL):${NC} localhost:3306"

echo -e "\n${BLUE}=== Container Status ===${NC}"
docker-compose ps

echo -e "\n${GREEN}✓ All services are starting!${NC}"
echo -e "${BLUE}Use 'docker-compose logs -f' to see logs${NC}"
echo -e "${BLUE}Use 'docker-compose down' to stop all services${NC}"
