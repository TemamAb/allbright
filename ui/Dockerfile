# syntax=docker/dockerfile:1
# Simple dashboard container - serves pre-built static assets
FROM nginx:1.27-alpine

# Copy nginx configuration
COPY ui/nginx.conf /etc/nginx/conf.d/default.conf

# Copy pre-built dashboard from local build output (Vite outputs to ui/dist)
COPY dist /usr/share/nginx/html

EXPOSE 80
