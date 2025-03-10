# Use a multi-stage build to reduce the final image size
FROM node:16.20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of your source code
COPY . .

# Build the React/Vite app (outputs to /app/dist)
RUN npm run build

# Use a minimal base image for the final stage
FROM nginx:alpine

# Remove default Nginx configuration files
RUN rm -rf /etc/nginx/conf.d/* /etc/nginx/nginx.conf

# Copy your custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the compiled output from the builder stage to the Nginx directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the port
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
