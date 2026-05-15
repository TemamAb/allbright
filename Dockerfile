# ==========================================
# DEPRECATED SOLVER DOCKERFILE
# ==========================================
# The Allbright Solver has been migrated directly into the Tauri Desktop 
# application (src-tauri). This Dockerfile now serves as a dummy container 
# to satisfy legacy Render service hooks without crashing the build pipeline.

FROM alpine:latest

# Expose the port Render expects to bind to
EXPOSE 10000

# Run a simple endless loop so the service doesn't crash on boot
CMD ["sh", "-c", "echo 'Allbright Solver migrated to Tauri Desktop. This dummy service is safely hibernating.' && sleep infinity"]
