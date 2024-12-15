# Stage 1: Build the React application
FROM node:16.20.2 AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
# RUN npm install --legacy-peer-deps

# Copy the rest of the source code
COPY . .

# Copy the .env file
COPY dev-frontend.env /dist/.env

# Build the application
#RUN npm run build

# Stage 2: Serve the React application with Nginx
FROM nginx:alpine

# Remove the default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the build output from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 1234
EXPOSE 1234

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
