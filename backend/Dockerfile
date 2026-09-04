# Base Image: Lightweight Node 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Copy backend source code
COPY . .

# Generate Prisma Client for database interaction
RUN npx prisma generate || true

# Expose Express server port
EXPOSE 5000

# Start backend server
CMD ["npm", "start"]
