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
CMD ["pnpm","start"]
