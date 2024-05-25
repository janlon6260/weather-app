# Use the official Node.js image for building the Svelte app
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the entire project to the working directory
COPY . .

# Build the Svelte project
RUN npm run build:production

# Use the official Nginx image for serving the SSR output
FROM nginx:alpine

# Copy the SSR output from the builder stage to the Nginx web root
COPY --from=builder /app/build /usr/share/nginx/html

# Expose the default Nginx port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
