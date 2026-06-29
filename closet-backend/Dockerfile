FROM python:3.10-slim

# install system-level libraries required by OpenCV & YOLOv8
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# establish working directory inside the container
WORKDIR /app

# copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy the rest of local repository files into the container
COPY . .

# 6. Expose the port Flask listens on
EXPOSE 5000

# 7. Start the production WSGI server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]