from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Header

SECRET_KEY = "55c06b0f05feef5de03642cfcc93341e2b1cd79fe2b5d2679dc7b7e800d4d844"
ALGORITHM = "HS256"

def create_token(email, name):
    payload = {
        "email": email,
        "name": name,
        "exp": datetime.now(timezone.utc) + timedelta(hours=8)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")