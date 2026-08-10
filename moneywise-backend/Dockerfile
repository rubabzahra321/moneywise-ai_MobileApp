FROM node:18-alpine

WORKDIR /app

# Copy dependency files first (so Docker can cache npm install between deploys)
COPY package.json ./
COPY package-lock.json ./

RUN npm install --production

# Copy the rest of your backend code
COPY . .

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "src/server.js"]
