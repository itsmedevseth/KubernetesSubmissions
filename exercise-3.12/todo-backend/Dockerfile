FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./

USER node

EXPOSE 3001

CMD ["node", "server.js"]
