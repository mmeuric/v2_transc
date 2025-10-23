FROM node:18-alpine
WORKDIR /app

# Installer curl pour healthcheck
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm install
COPY src ./src
EXPOSE 4001

# Healthcheck pour Docker
HEALTHCHECK --interval=5s --timeout=3s --retries=5 \
  CMD curl -f http://localhost:4001/health || exit 1

CMD ["node", "src/server.js"]
