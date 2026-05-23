from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base
import enum


class InvoiceStatus(str, enum.Enum):
    unpaid = "unpaid"
    paid = "paid"


class Client(Base):
    __tablename__ = "clients"
    __table_args__ = {"schema": "app"}

    client_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("app.users.user_id"), nullable=False)
    name = Column(String(100), nullable=False)
    contact_name = Column(String(100))
    address = Column(String(255))
    email = Column(String(255))
    created_at = Column(DateTime, default=datetime.now)

    invoices = relationship("Invoice", back_populates="client")


class InvoiceItemTemplate(Base):
    __tablename__ = "invoice_item_templates"
    __table_args__ = {"schema": "app"}

    template_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("app.users.user_id"), nullable=False)
    name = Column(String(100), nullable=False)
    unit_price = Column(Numeric(12, 0), nullable=False)
    tax_rate = Column(Numeric(4, 2), nullable=False, default=0.10)


class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = {"schema": "app"}

    invoice_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("app.users.user_id"), nullable=False)
    client_id = Column(Integer, ForeignKey("app.clients.client_id"), nullable=False)
    invoice_number = Column(String(20), nullable=False)
    issued_at = Column(DateTime, nullable=False)
    due_at = Column(DateTime, nullable=False)
    status = Column(String(10), nullable=False, default=InvoiceStatus.unpaid)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)

    client = relationship("Client", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    __table_args__ = {"schema": "app"}

    item_id = Column(Integer, primary_key=True, autoincrement=True)
    invoice_id = Column(Integer, ForeignKey("app.invoices.invoice_id"), nullable=False)
    name = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(12, 0), nullable=False)
    tax_rate = Column(Numeric(4, 2), nullable=False, default=0.10)

    invoice = relationship("Invoice", back_populates="items")


class Profile(Base):
    __tablename__ = "profiles"
    __table_args__ = {"schema": "app"}

    profile_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("app.users.user_id"), nullable=False, unique=True)
    display_name = Column(String(100), nullable=False)
    company_name = Column(String(100))
    address = Column(String(255))
    phone = Column(String(20))
    bank_info = Column(Text)
