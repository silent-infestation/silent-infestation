# Build du projet
FROM node:18-alpine AS build

ENV NODE_ENV=dev

WORKDIR /usr/src/app

COPY package.json .
RUN npm install

COPY . .

# Exécution
FROM node:18-alpine

WORKDIR /usr/src/app

RUN apk update && apk add --no-cache bash

COPY --from=build /usr/src/app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "run", "dev"]
# Changer pour npm run start pour la production
