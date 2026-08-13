FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml ./
COPY . ./
RUN pip install --no-cache-dir .
CMD ["uvicorn", "elite_tickets.main:app", "--host", "0.0.0.0", "--port", "8000"]
