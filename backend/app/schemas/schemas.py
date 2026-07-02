import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    name: str
    phone: str
    email: str
    business_name: str
    rubro: str


class RegisterResponse(BaseModel):
    session_token: str
    user_id: str
    welcome_message: str


class ChatRequest(BaseModel):
    session_token: str
    message: str
    image_url: str | None = None


class ChatResponse(BaseModel):
    reply: str
    image_url: str | None = None
    appointment: dict | None = None


class AppointmentOut(BaseModel):
    id: uuid.UUID
    client_name: str
    scheduled_at: datetime
    reason: str | None
    status: str
    google_event_id: str | None

    model_config = {"from_attributes": True}
