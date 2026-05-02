from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.schemas.project import ProjectCreate, ProjectResponse
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User
from app.utils.dependencies import get_db
from app.utils.auth_dependency import get_current_user
from app.core.exceptions import forbidden, not_found, bad_request
from app.core.logger import logger

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("/", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    logger.info(f"Creating new project: {project.name}")

    if user["role"] != "admin":
        logger.error("Non-admin tried to create project")
        raise forbidden("Only admin can create project")

    new_project = Project(
        name=project.name,
        description=project.description,
        created_by=user["user_id"]
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    logger.info(f"Project created successfully: {new_project.id}")
    return new_project


@router.get("/", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(Project).all()

@router.post("/{project_id}/add-member/{user_id}")
def add_member(project_id: int, user_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    logger.info(f"Adding member {user_id} to project {project_id}")

    if user["role"] != "admin":
        logger.error("Non-admin tried to add member")
        raise forbidden("Only admin can add members")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise not_found("Project not found")

    user_exists = db.query(User).filter(User.id == user_id).first()
    if not user_exists:
        raise not_found("User not found")

    existing_member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()
    
    if existing_member:
        raise bad_request("Member already in project")

    member = ProjectMember(user_id=user_id, project_id=project_id)

    db.add(member)
    db.commit()

    logger.info("Member added successfully")
    return {
        "success": True,
        "message": "Member added successfully"
    }

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    logger.info(f"Deleting project: {project_id}")

    if user["role"] != "admin":
        logger.error("Non-admin tried to delete project")
        raise forbidden("Only admin can delete projects")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise not_found("Project not found")

    db.delete(project)
    db.commit()

    logger.info(f"Project {project_id} deleted successfully")
    return {"message": "Project deleted successfully"}

