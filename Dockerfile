# ====================================================================
# STAGE 1: BUILDER
# ====================================================================
FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm install --force

COPY . .

RUN npm run heroku-postbuild

# ====================================================================
# STAGE 2: PRODUCTION
# ====================================================================
FROM node:22-alpine

ENV PORT 80
EXPOSE 80

RUN npm install -g serve

WORKDIR /usr/src/app

COPY --from=builder /app/web-build ./web-build

# Sintaxe mais robusta: usa $PORT se definida pelo Dokku, senão usa 5000
CMD serve -s web-build -l tcp://0.0.0.0:${PORT:-5000}