FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    EPHEMERIS_DATA_DIR=/app/data \
    EPHEMERIS_KERNEL_FILE=de440s.bsp \
    EPHEMERIS_LOAD_KERNEL_ON_STARTUP=true

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

EXPOSE 8080

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
