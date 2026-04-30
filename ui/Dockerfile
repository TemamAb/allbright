FROM nginx:1.27-alpine

# Copy nginx configuration to templates folder so envsubst can inject $PORT
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built static assets (Render will run `pnpm build` before Docker build)
COPY dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
