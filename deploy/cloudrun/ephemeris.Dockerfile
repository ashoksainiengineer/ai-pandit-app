FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    EPHEMERIS_DATA_DIR=/app/data \
    EPHEMERIS_KERNEL_FILE=de440s.bsp \
    EPHEMERIS_LOAD_KERNEL_ON_STARTUP=true

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Layer 1: Dependencies (cached unless pyproject.toml changes)
COPY services/ephemeris/pyproject.toml /app/pyproject.toml
RUN mkdir -p /app/app /app/data
# Placeholder package so pip install . succeeds before real app code arrives
RUN echo '__version__ = "0.0.0"' > /app/app/__init__.py
RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir .

# Layer 2: Download DE440 kernel (~115MB) — cached when deps don't change
RUN python -c "from skyfield.api import Loader; l = Loader('/app/data'); l('de440s.bsp'); print('DE440 kernel downloaded successfully.')"

# Layer 3: Real app code (cheap to bust, no heavy ops)
COPY services/ephemeris/app /app/app
RUN pip install --no-cache-dir --no-deps .

# Switch to non-root user
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Health check for Cloud Run
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
  CMD python -c "import urllib.request, os; port=os.environ.get('PORT','8000'); urllib.request.urlopen(f'http://localhost:{port}/health', timeout=5)" || exit 1

# Shell form to respect Cloud Run PORT env var (default 8000)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
