from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
# Import models to ensure they are registered with Base
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.project_member import ProjectMember

from app.routes import auth, project, task, dashboard
from app.utils.auth_dependency import get_current_user

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Create tables
Base.metadata.create_all(bind=engine)

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

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

# --- Serve Frontend ---
# In production (Railway), serve the built files from frontend/dist
frontend_path = os.path.join(os.getcwd(), "frontend", "dist")

if os.path.exists(frontend_path):
    # Serve assets (JS, CSS, images) from the dist folder
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
    
    # Catch-all for SPA routing (redirects all non-API paths to index.html)
    @app.get("/{fallback_path:path}")
    async def frontend_fallback(fallback_path: str):
        if fallback_path.startswith("api"):
            return {"error": "Not Found"}
        return FileResponse(os.path.join(frontend_path, "index.html"))
else:
    # Fallback for development if dist isn't built
    @app.get("/")
    def dev_warning():
        return {"message": "API is running. For frontend, run 'npm run dev' in the frontend folder."}
