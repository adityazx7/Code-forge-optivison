# Multi-stage Dockerfile — OptiVision AI
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --production=false
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend + serve frontend
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY backend/ ./backend/
COPY data/ ./data/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose ports
EXPOSE 8000 5173

# Start backend (frontend can be served via nginx or dev server)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
