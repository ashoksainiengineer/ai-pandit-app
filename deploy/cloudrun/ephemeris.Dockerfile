FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    EPHEMERIS_DATA_DIR=/app/data \
    EPHEMERIS_KERNEL_FILE=de440s.bsp \
    EPHEMERIS_LOAD_KERNEL_ON_STARTUP=true

WORKDIR /app

# Copy source and pyproject.toml only (kernel downloaded at build time)
COPY services/ephemeris/pyproject.toml /app/pyproject.toml
COPY services/ephemeris/app /app/app
RUN mkdir -p /app/data

# Install Python deps + skyfield
RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir .

# Download JPL DE440 kernel (~115MB)
RUN python -c "from skyfield.api import Loader; l = Loader('/app/data'); l('de440s.bsp'); print('Kernel downloaded successfully.')"

EXPOSE 8080

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
