# Build du projet
FROM node:18-alpine AS build

ENV NODE_ENV=dev

WORKDIR /usr/src/app

COPY package.json .
RUN npm install
# Changer pour npm run build pour la production

# Exécution
FROM node:18-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache \
    dcron \
    nmap \
    git \
    bash \
    chromium && \
    rm -rf /var/cache/apk/*

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
# Changer pour npm run start pour la production
