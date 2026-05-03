from fastapi import FastAPI, StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from app.database import engine, Base
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.project_member import ProjectMember
from app.routes import auth, project, task, dashboard

# Create tables (only if engine exists)
if engine is not None:
    try:
        print("Initializing database tables...")
        Base.metadata.create_all(bind=engine)
        print("Database tables initialized successfully.")
    except Exception as e:
        print(f"ERROR: Database initialization failed: {e}")
else:
    print("WARNING: Database engine not initialized. Skipping table creation.")

app = FastAPI(title="TasklyAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(project.router, prefix="/api")
app.include_router(task.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "TasklyAI API is running"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

# --- Serve Frontend ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
frontend_path = os.path.join(BASE_DIR, "frontend", "dist")

if os.path.exists(frontend_path):
    # Serve static files from the assets directory
    assets_path = os.path.join(frontend_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
    
    # Also mount any other top-level static files if needed, 
    # but specifically handle index.html via a catch-all
    
    @app.get("/{fallback_path:path}")
    async def frontend_fallback(fallback_path: str):
        # Ignore API calls
        if fallback_path.startswith("api"):
            return {"error": "Not Found", "path": fallback_path}
            
        # Check if the file exists in the dist folder (e.g. favicon.ico, robots.txt)
        file_path = os.path.join(frontend_path, fallback_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Otherwise, serve index.html for SPA routing
        return FileResponse(os.path.join(frontend_path, "index.html"))
else:
    @app.get("/")
    def dev_warning():
        return {"message": "API is running. For frontend, run 'npm run dev' in the frontend folder."}
