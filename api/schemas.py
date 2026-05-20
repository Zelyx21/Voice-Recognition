from pydantic import BaseModel, EmailStr, field_validator

class RegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    def name_not_empty(cls, v):
        if len(v.strip())<2:
            raise ValueError("Name must be at least 2 characters")
        return v.strip()
    
    @field_validator("password")
    def password_strong_enough(cls,v):
        if len(v)<8:
            raise ValueError("Password must be at least 8 characters")
        return v

class LoginSchema(BaseModel):
    email: EmailStr

    @field_validator("email")
    def email_not_empty(cls,v):
        if not v.strip():
            raise ValueError("Email is required")
        return v.strip()