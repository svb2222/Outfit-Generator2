FROM python:3.11-slim

WORKDIR /app

# Copy and install dependencies directly (no apt-get required!)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN pip uninstall -y opencv-python opencv-python-headless && \
    pip install --no-cache-dir opencv-python-headless==4.12.0.88

COPY . .

EXPOSE 5000
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5000} app:app"]
#CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]