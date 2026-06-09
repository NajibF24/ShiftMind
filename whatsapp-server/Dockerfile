FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache git

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Expose port 3000 for HTTP and WebSocket
EXPOSE 3000

# Directory for baileys auth state
RUN mkdir -p /app/baileys_auth_info && chown node:node /app/baileys_auth_info

USER node

CMD ["npm", "start"]
