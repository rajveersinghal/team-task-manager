from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional, List

from app.models.task import Task
from app.models.project import Project
from app.models.user import User
from app.schemas.task import TaskResponse
from app.utils.dependencies import get_db
from app.utils.auth_dependency import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/my-tasks", response_model=List[TaskResponse])
def get_my_tasks(sort: Optional[str] = None, db: Session = Depends(get_db), user=Depends(get_current_user)):

    query = db.query(
        Task.id,
        Task.title,
        Task.description,
        Task.status,
        Task.assigned_to,
        Task.project_id,
        Task.due_date,
        Project.name.label("project_name"),
        User.name.label("assigned_to_name")
    ).outerjoin(Project, Task.project_id == Project.id).outerjoin(User, Task.assigned_to == User.id).filter(Task.assigned_to == user["user_id"])
    
    if sort == "due_date":
        query = query.order_by(Task.due_date.asc())

    tasks = query.all()

    return tasks

@router.get("/summary")
def task_summary(db: Session = Depends(get_db), user=Depends(get_current_user)):

    result = db.query(
        Task.status,
        func.count(Task.id)
    ).filter(
        Task.assigned_to == user["user_id"]
    ).group_by(Task.status).all()

    stats_dict = {str(row[0]): int(row[1]) for row in result}
    return {"summary": stats_dict}

@router.get("/overdue", response_model=List[TaskResponse])
def overdue_tasks(db: Session = Depends(get_db), user=Depends(get_current_user)):

    now = datetime.utcnow()

    query = db.query(
        Task.id,
        Task.title,
        Task.description,
        Task.status,
        Task.assigned_to,
        Task.project_id,
        Task.due_date,
        Project.name.label("project_name"),
        User.name.label("assigned_to_name")
    ).outerjoin(Project, Task.project_id == Project.id).outerjoin(User, Task.assigned_to == User.id).filter(
        Task.due_date < now,
        Task.status != "done"
    )

    if user["role"] != "admin":
        query = query.filter(Task.assigned_to == user["user_id"])

    tasks = query.all()

    return tasks

@router.get("/filter", response_model=List[TaskResponse])
def filter_tasks(status: str, db: Session = Depends(get_db), user=Depends(get_current_user)):

    tasks = db.query(
        Task.id,
        Task.title,
        Task.description,
        Task.status,
        Task.assigned_to,
        Task.project_id,
        Task.due_date,
        Project.name.label("project_name"),
        User.name.label("assigned_to_name")
    ).outerjoin(Project, Task.project_id == Project.id).outerjoin(User, Task.assigned_to == User.id).filter(
        Task.assigned_to == user["user_id"],
        Task.status == status
    ).all()

    return tasks

@router.get("/admin-stats")
def admin_stats(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user["role"] != "admin":
        from app.core.exceptions import forbidden
        raise forbidden("Only admin can access global stats")
    
    total = db.query(func.count(Task.id)).scalar()
    completed = db.query(func.count(Task.id)).filter(Task.status == "done").scalar()
    in_progress = db.query(func.count(Task.id)).filter(Task.status == "in-progress").scalar()
    overdue = db.query(func.count(Task.id)).filter(
        Task.due_date < datetime.utcnow(),
        Task.status != "done"
    ).scalar()
    
    return {
        "total": total,
        "completed": completed,
        "in_progress": in_progress,
        "overdue": overdue
    }

@router.get("/all-tasks", response_model=List[TaskResponse])
def get_all_tasks(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user["role"] != "admin":
        from app.core.exceptions import forbidden
        raise forbidden("Only admin can access all tasks")

    tasks = db.query(
        Task.id,
        Task.title,
        Task.description,
        Task.status,
        Task.assigned_to,
        Task.project_id,
        Task.due_date,
        Project.name.label("project_name"),
        User.name.label("assigned_to_name")
    ).outerjoin(Project, Task.project_id == Project.id).outerjoin(User, Task.assigned_to == User.id).all()

    return tasks

@router.get("/project-summary")
def project_summary(db: Session = Depends(get_db), user=Depends(get_current_user)):
    result = db.query(
        Project.name,
        func.count(Task.id)
    ).join(Task, Task.project_id == Project.id).filter(
        Task.assigned_to == user["user_id"]
    ).group_by(Project.name).all()

    summary_dict = {str(row[0]): int(row[1]) for row in result}
    return {"project_summary": summary_dict}
