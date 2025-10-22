# 1. Start with an official Python base image
FROM python:3.11-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy the rest of the application code
COPY . .

# 5. Expose the port the app runs on (we'll use 5000)
EXPOSE 5000

# 6. Define the command to run the application
# We use Gunicorn in a real environment, but for this project,
# Flask's built-in server is perfectly fine.
CMD ["python", "app.py"]