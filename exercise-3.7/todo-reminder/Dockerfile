FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package.json reminder.js ./

USER node

CMD ["node", "reminder.js"]
