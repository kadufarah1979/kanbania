FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
RUN npx tsc -p tsconfig.server.json

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
RUN npm install -g concurrently

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# WS server (compiled with full dependency tree)
COPY --from=build /app/dist-server ./dist-server

# Runtime deps for WS server — copy full node_modules to avoid missing transitive deps
COPY --from=deps /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000 8766

CMD ["concurrently", "node server.js", "node dist-server/server.js"]
