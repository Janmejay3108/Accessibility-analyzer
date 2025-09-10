# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy everything first
COPY . .

# Install root dependencies
RUN npm install --production

# Build frontend
RUN cd frontend && npm install && npm run build

# Install backend dependencies
RUN cd backend && npm install --production

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
