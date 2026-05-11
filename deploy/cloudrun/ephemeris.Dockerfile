#BM|FROM python:3.11-slim
#KM|
#WN|ENV PYTHONDONTWRITEBYTECODE=1 \
#TM|    PYTHONUNBUFFERED=1 \
#BX|    EPHEMERIS_DATA_DIR=/app/data \
#HT|    EPHEMERIS_KERNEL_FILE=de440s.bsp \
#TW|    EPHEMERIS_LOAD_KERNEL_ON_STARTUP=true
#JT|
#NK|# Create non-root user for security
#PV|RUN groupadd -r appuser && useradd -r -g appuser appuser
#TX|
#XM|WORKDIR /app
#BY|
#NT|# Layer 1: Dependencies (cached unless pyproject.toml changes)
#JW|COPY services/ephemeris/pyproject.toml /app/pyproject.toml
#MX|RUN mkdir -p /app/app /app/data
#SM|# Placeholder package so pip install . succeeds before real app code arrives
#YT|RUN echo '__version__ = "0.0.0"' > /app/app/__init__.py
#XK|RUN pip install --no-cache-dir --upgrade pip \
#NV|  && pip install --no-cache-dir .
#ZP|
#XZ|# Layer 2: Download DE440 kernel (~115MB) — cached when deps don't change
#VR|RUN python -c "from skyfield.api import Loader; l = Loader('/app/data'); l('de440s.bsp'); print('DE440 kernel downloaded successfully.')"
#XW|
#HN|# Layer 3: Real app code (cheap to bust, no heavy ops)
#QS|COPY services/ephemeris/app /app/app
#PR|RUN pip install --no-cache-dir --no-deps .
#ZR|
#WZ|# Switch to non-root user
#QV|RUN chown -R appuser:appuser /app
#XM|USER appuser
#QY|
#PQ|EXPOSE 8000
#TX|
#JQ|# Health check for Cloud Run
#YV|HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
#KX|  CMD python -c "import urllib.request, os; port=os.environ.get('PORT','8000'); urllib.request.urlopen(f'http://localhost:{port}/health', timeout=5)" || exit 1
#MS|
#ZR|# Shell form to respect Cloud Run PORT env var (default 8000)
#RJ|CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
