# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend-src
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
RUN npm run build

# Stage 2: Production Python Backend & Single-Container Serving
FROM python:3.13-slim
WORKDIR /app

# Install system build dependencies & libpq for PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend application source code
COPY backend/ .

# Copy built frontend assets from Stage 1 into /app/frontend/dist and public
COPY --from=frontend-builder /frontend-src/dist ./frontend/dist
COPY --from=frontend-builder /frontend-src/public ./frontend/public

# Pre-seed static uploads directory with demo image assets
RUN mkdir -p static/uploads && cp -f frontend/public/demo_* static/uploads/ 2>/dev/null || true

# Expose default port
EXPOSE 8000

# Default environment settings
ENV PORT=8000
ENV ENVIRONMENT=production

# Health check to ensure zero-downtime Render deployment
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Start Uvicorn in production mode
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
