from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.routers import register, chat, appointments, login, business_profile


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Empleado IA",
    version="2.0.0",
    lifespan=lifespan,
    servers=[{"url": "http://localhost:8000", "description": "Local"}],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(register.router)
app.include_router(login.router)
app.include_router(chat.router)
app.include_router(appointments.router)
app.include_router(business_profile.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
