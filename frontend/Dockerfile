FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# The source is mounted as a volume in dev.
# For production we would copy it and build:
# COPY . .
# RUN npm run build

# CMD is provided in docker-compose.yml for dev
