# Use official Python base image
FROM python:3.10.14-slim

# Set environment
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements if exists
# Expect a requirements.txt in repo root or use fallback to none
COPY requirements.txt ./requirements.txt
RUN pip install --upgrade pip setuptools wheel \
    && if [ -f ./requirements.txt ]; then pip install -r ./requirements.txt; fi

# Copy app source
COPY . /app

# Create a user to run the app (non-root)
RUN useradd --create-home appuser
USER appuser

# Expose port (match what uvicorn uses)
EXPOSE 8000

# Default command uses uvicorn (you can override in docker-compose)
# If you use a different entrypoint, override in compose or in docker run
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]