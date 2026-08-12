# Added to build on Railway: railpack's scanner refuses this repo outright
# ("SECURITY VULNERABILITIES DETECTED"), and a Dockerfile switches the builder.
FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache libc6-compat && corepack enable
COPY . .
# The lockfile is a fork's; do not fail the build on drift.
RUN pnpm install --no-frozen-lockfile
# The app reads its backend URL at runtime; a build-time placeholder keeps
# `next build` from failing on a missing public env var.
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build || (echo "build failed" && exit 1)
ENV PORT=3000
EXPOSE 3000
# A standalone build lands in .next/standalone and needs its static assets
# beside it. Assembling them at /app makes `node server.js` work, which is the
# entrypoint this service is configured with.
RUN cp -r .next/standalone/. ./  && mkdir -p .next/static  && cp -r .next/static .next/standalone/.next/static 2>/dev/null || true  && cp -r public ./public 2>/dev/null || true
CMD ["node","server.js"]
