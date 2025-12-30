# Base image
FROM node:22.16.0

WORKDIR /AdminPortal-20012025

# Copy package files
COPY package.json package-lock.json ./

# Disable the Prisma postinstall hook before installing
RUN npm pkg delete scripts.postinstall

# Install dependencies without running postinstall
RUN npm install --force

# Copy source code
COPY . .

# Run postinstall scripts that need the source
RUN npx prisma generate && npm run build:icons
#RUN npx prisma generate && npm run build:icons  -- for powershell


# Build Next.js
RUN npm run build
# RUN next build --no-lint

# Expose port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start Next.js
CMD ["npm", "start"]
