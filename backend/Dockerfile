# Use an official lightweight Python image.
# https://hub.docker.com/_/python
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /code

# Install dependencies
COPY requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy project including `backend_app` directory
COPY . /code/

# Expose the API port (Hugging Face Spaces defaults to 7860)
EXPOSE 7860

# Add both /code and /code/backend to PYTHONPATH to ensure backend_app can be imported
# regardless of whether the build context was root or the backend folder.
ENV PYTHONPATH="/code:/code/backend:$PYTHONPATH"

# Command to run the application using uvicorn.
# We use 'sh -c' to inspect the directory structure before starting, which helps debug 'ModuleNotFoundError'.
CMD ["sh", "-c", "ls -R /code && uvicorn app:app --host 0.0.0.0 --port 7860"]
