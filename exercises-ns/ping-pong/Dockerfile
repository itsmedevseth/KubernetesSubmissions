FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# No npm dependencies, so no install step is needed.
COPY package.json server.js ./

# Run as the unprivileged "node" user (uid 1000).
USER node

EXPOSE 3001

# Exec form so Node receives SIGTERM directly from Kubernetes.
CMD ["node", "server.js"]
