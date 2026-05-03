from fastapi import FastAPI
import sys
import os

# Try to import the main app
try:
    from app.main import app as main_app
    app = main_app
except Exception as e:
    # If the main app fails to load, create a minimal fallback app for diagnostics
    app = FastAPI()
    
    @app.get("/api/health")
    def health():
        return {
            "status": "error",
            "message": "Failed to load main app",
            "error": str(e),
            "python_version": sys.version,
            "cwd": os.getcwd()
        }

@app.get("/api/diagnostic")
def diagnostic():
    return {"status": "ok", "message": "Vercel Python environment is working!"}
