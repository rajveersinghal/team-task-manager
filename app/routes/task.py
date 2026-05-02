from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.task import TaskCreate
from app.models.task import Task
from app.models.user import User
from app.models.project import Project
from app.utils.dependencies import get_db
from app.utils.auth_dependency import get_current_user
from app.core.exceptions import bad_request, not_found, forbidden
from app.core.logger import logger

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("/")
def create_task(task: TaskCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    logger.info(f"Creating new task: {task.title}")

    if user["role"] != "admin":
        logger.error("Non-admin tried to create a task")
        raise forbidden("Only admin can create tasks")

    user_exists = db.query(User).filter(User.id == task.assigned_to).first()
    if not user_exists:
        raise not_found("Assigned user not found")

    project_exists = db.query(Project).filter(Project.id == task.project_id).first()
    if not project_exists:
        raise not_found("Project not found")

    new_task = Task(**task.dict())

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    logger.info(f"Task created successfully: {new_task.id}")
    return new_task


@router.put("/{task_id}")
def update_task(task_id: int, status: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    logger.info(f"Updating task {task_id}")
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise not_found("Task not found")

    if task.assigned_to != user["user_id"]:
        logger.error(f"User {user['user_id']} tried to update task {task_id} assigned to {task.assigned_to}")
        raise forbidden("Not allowed")

    task.status = status
    db.commit()

    logger.info(f"Task {task_id} updated to status {status}")
    return {
        "success": True,
        "message": "Task updated successfully"
    }
