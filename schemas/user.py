from pydantic import BaseModel, Field, EmailStr


class RegisterSchema(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserSchema(BaseModel):
    user_id: int
    email: str
