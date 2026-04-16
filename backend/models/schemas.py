"""
DocMind AI — Pydantic Schemas
All request/response models for the API.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime


# ─── Auth Schemas ───

class AuthRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class AuthResponse(BaseModel):
    access_token: str
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str


class MessageResponse(BaseModel):
    message: str


# ─── Document Schemas ───

class DocumentResponse(BaseModel):
    id: str
    original_name: str
    file_type: str
    file_size: int
    num_chunks: int
    status: str
    error_msg: Optional[str] = None
    created_at: str


class DocumentStatusResponse(BaseModel):
    id: str
    status: str
    num_chunks: int
    error_msg: Optional[str] = None


class DocumentUploadResponse(BaseModel):
    id: str
    original_name: str
    status: str


# ─── Query Schemas ───

class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)


class SourceInfo(BaseModel):
    document_id: str
    source: str
    content: str
    similarity: float


class AskResponse(BaseModel):
    answer: str
    sources: List[SourceInfo]
