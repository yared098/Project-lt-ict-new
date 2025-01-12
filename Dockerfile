FROM nginx:alpine

# Install Node.js & npm via apk (Alpine package manager)
# 'apk add nodejs npm' should install the versions available in the Alpine repositories
RUN apk add --no-cache nodejs npm

# Create and set a working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) first for better caching
COPY package*.json ./

# Install dependencies
# (Use --legacy-peer-deps if you need to bypass certain peer-dep checks)
RUN npm install --legacy-peer-deps

# Copy the rest of your source code (including .env, src, etc.)
COPY . .

# If you have environment variables prefixed with VITE_ in your .env,
# they will be read at build time by Vite.
# Build the app (this outputs files to /app/dist by default)
RUN npm run build

##
# Stage 2: Serve with Nginx
##
FROM nginx:alpine

# Remove default index and other static files in /usr/share/nginx/html
RUN rm -rf /usr/share/nginx/html/*

# Copy your compiled build from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# (Optional) If you have a custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port that Nginx listens on (default 80 in nginx:alpine)
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
