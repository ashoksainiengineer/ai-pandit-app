FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

COPY pyproject.toml /app/pyproject.toml
COPY app /app/app
# BUG-FIX NOTE: data/ directory containing DE440 kernel must be mounted at runtime
# or copied separately: COPY data /app/data

RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir .

# Switch to non-root user
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Health check for local development
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=30s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=5)" || exit 1

# JSON array form for proper SIGTERM handling (no shell wrapper)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
