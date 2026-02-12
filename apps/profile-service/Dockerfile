FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY apps/profile-service/package*.json ./apps/profile-service/
COPY tsconfig.base.json ./
COPY nx.json ./

RUN npm install

COPY apps/profile-service ./apps/profile-service
COPY libs ./libs

RUN npx nx build profile-service --prod

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist/apps/profile-service ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "main.js"]
