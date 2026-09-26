FROM python:3.12-slim

WORKDIR /app

# Install Git because CloudGuard clones GitHub repositories
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# SQLite database is mounted from the host through docker-compose
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]