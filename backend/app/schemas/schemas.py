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


class BusinessProfileRequest(BaseModel):
    session_token: str
    tone: str | None = None
    description: str | None = None
    address: str | None = None
    opening_hours: str | None = None
    services: list[dict] | None = None
    faq: list[dict] | None = None
    rules: list[str] | None = None
    booking_enabled: bool | None = None
    reminders_enabled: bool | None = None
    whatsapp_enabled: bool | None = None


class BusinessProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    tone: str
    description: str | None
    address: str | None
    opening_hours: str | None
    services: list
    faq: list
    rules: list
    booking_enabled: bool
    reminders_enabled: bool
    whatsapp_enabled: bool

    model_config = {"from_attributes": True}
