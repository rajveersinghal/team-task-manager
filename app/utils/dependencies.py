from app.database import SessionLocal

def get_db():
    if SessionLocal is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Database not configured.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()