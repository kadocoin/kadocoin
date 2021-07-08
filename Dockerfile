# # Kadocoin License
#
# Copyright (c) 2021 Adamu Muhammad Dankore
# Distributed under the MIT software license, see the accompanying
# file LICENSE or <http://www.opensource.org/licenses/mit-license.php>

# Install dependencies only when needed
FROM node:latest AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM node:latest AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN yarn build

# Production image, copy all the files and run next!
FROM node:latest AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 2000

CMD ["yarn", "start"]