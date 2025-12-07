"""
WSGI entry point for production deployment
Use with Gunicorn: gunicorn wsgi:app
"""
from api import app

if __name__ == "__main__":
    app.run()
