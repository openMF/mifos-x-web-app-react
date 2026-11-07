# =============================================================================
# Mifos X React Web App — Multi-stage Docker Build
# =============================================================================
# Stage 1: Build the React/Vite app (Node Alpine)
# Stage 2: Serve with Nginx (Alpine slim)
#
# Follows the same pattern as the Angular openmf/web-app Dockerfile:
#   - Plain HTTP on port 80
#   - envsubst for runtime environment injection
#   - No SSL (handle TLS at reverse-proxy / load balancer level)
# =============================================================================

###############
### STAGE 1: Build app
###############
ARG BUILDER_IMAGE=node:24-alpine3.23
ARG NGINX_IMAGE=nginx:1.31.0-alpine3.23-slim

FROM $BUILDER_IMAGE AS builder

# Set the environment variable to increase Node.js memory limit
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install Java (required by openapi-generator-cli for SDK generation)
RUN apk add --no-cache openjdk17-jre-headless git

WORKDIR /app

ENV PATH=/app/node_modules/.bin:$PATH

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build configuration
COPY ./ /app/

# Build the application (generate-sdk + tsc + vite build)
RUN npm run build

###############
### STAGE 2: Serve app with nginx
###############
FROM $NGINX_IMAGE

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# When the container starts, replace the env.js with values from environment variables
CMD ["/bin/sh", "-c", "envsubst < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js && exec nginx -g 'daemon off;'"]
