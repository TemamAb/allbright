# ==========================================
# DEPRECATED SOLVER DOCKERFILE  
# ==========================================
# The Allbright Solver has been migrated directly into the Tauri Desktop 
# application (src-tauri). This Dockerfile now serves as a dummy container 
# to satisfy legacy Render service hooks without crashing the build pipeline.

FROM alpine:latest

# Install minimal HTTP server
RUN apk add --no-cache netcat-openbsd

# Expose the port Render expects (3000)
EXPOSE 3000

# Minimal HTTP responder for Render health checks: Listens on $PORT (defaults to 3000)
CMD ["sh", "-c", "while true; do printf 'HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n' | nc -l -p ${PORT:-3000} -q 1; done"]
