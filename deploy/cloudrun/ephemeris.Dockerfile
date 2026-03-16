FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    EPHEMERIS_DATA_DIR=/app/data \
    EPHEMERIS_KERNEL_FILE=de440s.bsp \
    EPHEMERIS_LOAD_KERNEL_ON_STARTUP=true

WORKDIR /app

COPY services/ephemeris/pyproject.toml /app/pyproject.toml
COPY services/ephemeris/app /app/app
COPY services/ephemeris/data /app/data

RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir .

EXPOSE 8080

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
