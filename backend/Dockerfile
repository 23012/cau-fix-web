# 개발
FROM node:24-alpine AS development
RUN apk add --no-cache tzdata
ENV TZ=Asia/Seoul
WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# 운영
FROM node:24-alpine AS production
RUN apk add --no-cache tzdata
ENV TZ=Asia/Seoul
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/app.js"]