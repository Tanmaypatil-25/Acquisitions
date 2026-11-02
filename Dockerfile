# Use lightweight Node 22 Alpine base image
FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies in a separate stage for caching
FROM base AS dependencies
COPY package.json package-lock.json ./
# Install only production dependencies for production stage
RUN npm ci --only=production
# Keep a copy of devDependencies for dev stage
RUN cp -R node_modules prod_node_modules
RUN npm ci

# Development image
FROM base AS development
ENV NODE_ENV=development
COPY package.json package-lock.json ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS production
ENV NODE_ENV=production
# Run as non-root user for security best practices
USER node
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node --from=dependencies /app/prod_node_modules ./node_modules
COPY --chown=node:node . .
EXPOSE 3000
CMD ["npm", "start"]

