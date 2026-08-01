from __future__ import annotations

from sqlalchemy import Column, DateTime, ForeignKey, Integer, LargeBinary, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from .db import Base


class FileRecord(Base):
    __tablename__ = "files"

    file_id = Column(String, primary_key=True)
    filename = Column(String, nullable=False)
    file_extension = Column(String, nullable=False)  # "csv" | "xlsx" | "xls"
    content = Column(LargeBinary, nullable=False)  # original uploaded file bytes
    profile = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    messages = relationship(
        "ChatMessageRecord",
        back_populates="file",
        cascade="all, delete-orphan",
        order_by="ChatMessageRecord.created_at",
    )


class ChatMessageRecord(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    file_id = Column(
        String, ForeignKey("files.file_id", ondelete="CASCADE"), nullable=False, index=True
    )
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    sql = Column(Text, nullable=True)
    table_json = Column(JSONB, nullable=True)
    chart_json = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    file = relationship("FileRecord", back_populates="messages")
