from pydantic import BaseModel, EmailStr, field_validator, model_validator
from database.Qdrant import email_max, email_exists, email_audio_name_exists

class RegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    audio_name: str

    @field_validator("name")
    def name_not_empty(cls, v):
        if len(v.strip())<2:
            raise ValueError("Name must be at least 2 characters")
        return v.strip()
    
    @field_validator("email")
    def email_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Email is required")
        if email_exists(email=v.strip()):
            raise ValueError("Email already exists")
        return v.strip()

    @field_validator("password")
    def password_strong_enough(cls,v):
        if len(v)<8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("audio_name")
    def audio_name_not_empty(cls, v):
        if len(v)<3:
            raise ValueError("Audio name must be at least 3 characters")
        return v

    

class LoginSchema(BaseModel):
    email: EmailStr

    @field_validator("email")
    def email_not_empty(cls,v):
        if not v.strip():
            raise ValueError("Email is required")
        return v.strip()
    
class AddVoiceSchema(BaseModel):
    audio_name: str
    email: EmailStr

    @field_validator("audio_name")
    def audio_name_not_empty(cls, v):
        if len(v)<3:
            raise ValueError("Audio name must be at least 3 characters")
        return v

    @field_validator("email")
    def email_max_less_than_5(cls, v):
        if email_max(email=v.strip()):
            raise ValueError("Maximum number of audio files (5) reached for this email")
        return v.strip()

    @model_validator(mode="after")
    def audio_name_not_exists_for_email(self):
        if email_audio_name_exists(email=self.email.strip(), audio_name=self.audio_name):
            raise ValueError("Audio name already exists for this email")
        return self

    