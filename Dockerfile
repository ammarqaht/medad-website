# Medad website: build the static site with Node, serve it with nginx.
FROM node:24-alpine AS build
WORKDIR /app
ENV ASTRO_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY astro.config.mjs tsconfig.json ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM nginx:1.27-alpine
ENV PORT=8080
COPY deploy/default.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/headers.conf /etc/nginx/snippets/headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
