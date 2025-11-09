FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3003
CMD ["node", "src/index.js"]
