from fastapi import HTTPException

def bad_request(message: str):
    return HTTPException(status_code=400, detail=message)

def not_found(message: str):
    return HTTPException(status_code=404, detail=message)

def unauthorized(message: str):
    return HTTPException(status_code=401, detail=message)

def forbidden(message: str):
    return HTTPException(status_code=403, detail=message)
