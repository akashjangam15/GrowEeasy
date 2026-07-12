FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base AS runner
WORKDIR /app
COPY --from=build /usr/src/app/package.json /app/package.json
COPY --from=build /usr/src/app/pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY --from=build /usr/src/app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=build /usr/src/app/packages /app/packages
COPY --from=build /usr/src/app/apps/web /app/apps/web
COPY --from=build /usr/src/app/node_modules /app/node_modules

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD [ "pnpm", "--filter", "web", "start" ]
