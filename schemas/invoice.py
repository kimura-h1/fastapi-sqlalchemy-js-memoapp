from pydantic import BaseModel, Field
from datetime import datetime
from decimal import Decimal
from typing import Literal


# ===== Client =====

class ClientCreateSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    contact_name: str | None = None
    address: str | None = None
    email: str | None = None


class ClientSchema(ClientCreateSchema):
    client_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ===== InvoiceItemTemplate =====

class ItemTemplateCreateSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    unit_price: Decimal = Field(..., ge=0)
    tax_rate: Decimal = Field(Decimal("0.10"), ge=0, le=1)


class ItemTemplateSchema(ItemTemplateCreateSchema):
    template_id: int

    class Config:
        from_attributes = True


# ===== InvoiceItem =====

class InvoiceItemCreateSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    quantity: int = Field(..., ge=1)
    unit_price: Decimal = Field(..., ge=0)
    tax_rate: Decimal = Field(Decimal("0.10"), ge=0, le=1)


class InvoiceItemSchema(InvoiceItemCreateSchema):
    item_id: int
    subtotal: Decimal
    tax_amount: Decimal
    total: Decimal

    class Config:
        from_attributes = True


# ===== Invoice =====

class InvoiceCreateSchema(BaseModel):
    client_id: int
    issued_at: datetime
    due_at: datetime
    notes: str | None = None
    items: list[InvoiceItemCreateSchema] = Field(..., min_length=1)


class InvoiceUpdateSchema(BaseModel):
    client_id: int
    issued_at: datetime
    due_at: datetime
    notes: str | None = None
    items: list[InvoiceItemCreateSchema] = Field(..., min_length=1)


class InvoicePatchSchema(BaseModel):
    status: Literal["unpaid", "paid"]


class InvoiceSchema(BaseModel):
    invoice_id: int
    invoice_number: str
    client_id: int
    client_name: str
    issued_at: datetime
    due_at: datetime
    status: str
    notes: str | None
    items: list[InvoiceItemSchema]
    subtotal: Decimal
    tax_amount: Decimal
    total: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


class InvoiceListSchema(BaseModel):
    invoice_id: int
    invoice_number: str
    client_name: str
    issued_at: datetime
    due_at: datetime
    status: str
    total: Decimal
    created_at: datetime


# ===== Profile =====

class ProfileCreateSchema(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=100)
    company_name: str | None = None
    address: str | None = None
    phone: str | None = None
    bank_info: str | None = None


class ProfileSchema(ProfileCreateSchema):
    profile_id: int

    class Config:
        from_attributes = True
