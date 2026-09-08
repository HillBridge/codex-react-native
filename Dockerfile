FROM node:22.13-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY backend ./backend
USER node
CMD ["node", "backend/server.mjs"]
