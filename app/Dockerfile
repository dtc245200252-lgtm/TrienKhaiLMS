
FROM node:24-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
    && npm cache clean --force

COPY --chown=node:node server.js db.js ./
COPY --chown=node:node views ./views
COPY --chown=node:node public ./public

USER node

EXPOSE 3000

CMD ["node", "server.js"]
