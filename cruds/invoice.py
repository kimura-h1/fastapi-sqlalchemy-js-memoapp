from decimal import Decimal
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import models.invoice as m
import schemas.invoice as s


# ===== 請求書番号の自動採番 =====

async def generate_invoice_number(session: AsyncSession, user_id: int) -> str:
    result = await session.execute(
        select(func.count()).where(m.Invoice.user_id == user_id)
    )
    count = result.scalar() + 1
    from datetime import datetime
    ym = datetime.now().strftime("%Y%m")
    return f"INV-{ym}-{count:04d}"


# ===== 金額計算ヘルパー =====

def calc_item(item: m.InvoiceItem) -> dict:
    subtotal = Decimal(str(item.unit_price)) * item.quantity
    tax_amount = (subtotal * Decimal(str(item.tax_rate))).quantize(Decimal("1"))
    return {
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "total": subtotal + tax_amount,
    }


# ===== Client =====

async def create_client(session: AsyncSession, data: s.ClientCreateSchema, user_id: int) -> m.Client:
    client = m.Client(user_id=user_id, **data.model_dump())
    session.add(client)
    await session.commit()
    await session.refresh(client)
    return client


async def get_clients(session: AsyncSession, user_id: int) -> list[m.Client]:
    result = await session.execute(
        select(m.Client).where(m.Client.user_id == user_id).order_by(m.Client.name)
    )
    return result.scalars().all()


async def get_client(session: AsyncSession, client_id: int, user_id: int) -> m.Client | None:
    result = await session.execute(
        select(m.Client).where(m.Client.client_id == client_id, m.Client.user_id == user_id)
    )
    return result.scalars().first()


async def update_client(session: AsyncSession, client_id: int, data: s.ClientCreateSchema, user_id: int) -> m.Client | None:
    client = await get_client(session, client_id, user_id)
    if not client:
        return None
    for k, v in data.model_dump().items():
        setattr(client, k, v)
    await session.commit()
    await session.refresh(client)
    return client


async def delete_client(session: AsyncSession, client_id: int, user_id: int) -> m.Client | None:
    client = await get_client(session, client_id, user_id)
    if client:
        await session.delete(client)
        await session.commit()
    return client


# ===== InvoiceItemTemplate =====

async def create_template(session: AsyncSession, data: s.ItemTemplateCreateSchema, user_id: int) -> m.InvoiceItemTemplate:
    tmpl = m.InvoiceItemTemplate(user_id=user_id, **data.model_dump())
    session.add(tmpl)
    await session.commit()
    await session.refresh(tmpl)
    return tmpl


async def get_templates(session: AsyncSession, user_id: int) -> list[m.InvoiceItemTemplate]:
    result = await session.execute(
        select(m.InvoiceItemTemplate).where(m.InvoiceItemTemplate.user_id == user_id)
    )
    return result.scalars().all()


async def delete_template(session: AsyncSession, template_id: int, user_id: int) -> m.InvoiceItemTemplate | None:
    result = await session.execute(
        select(m.InvoiceItemTemplate).where(
            m.InvoiceItemTemplate.template_id == template_id,
            m.InvoiceItemTemplate.user_id == user_id,
        )
    )
    tmpl = result.scalars().first()
    if tmpl:
        await session.delete(tmpl)
        await session.commit()
    return tmpl


# ===== Invoice =====

async def create_invoice(session: AsyncSession, data: s.InvoiceCreateSchema, user_id: int) -> m.Invoice:
    invoice_number = await generate_invoice_number(session, user_id)
    invoice = m.Invoice(
        user_id=user_id,
        client_id=data.client_id,
        invoice_number=invoice_number,
        issued_at=data.issued_at,
        due_at=data.due_at,
        notes=data.notes,
        status="unpaid",
    )
    session.add(invoice)
    await session.flush()

    for item_data in data.items:
        item = m.InvoiceItem(invoice_id=invoice.invoice_id, **item_data.model_dump())
        session.add(item)

    await session.commit()
    await session.refresh(invoice)
    return invoice


async def get_invoices(
    session: AsyncSession,
    user_id: int,
    status: str | None = None,
    client_id: int | None = None,
) -> list[m.Invoice]:
    query = (
        select(m.Invoice)
        .options(selectinload(m.Invoice.client), selectinload(m.Invoice.items))
        .where(m.Invoice.user_id == user_id)
    )
    if status:
        query = query.where(m.Invoice.status == status)
    if client_id:
        query = query.where(m.Invoice.client_id == client_id)
    query = query.order_by(m.Invoice.issued_at.desc())
    result = await session.execute(query)
    return result.scalars().all()


async def get_invoice(session: AsyncSession, invoice_id: int, user_id: int) -> m.Invoice | None:
    result = await session.execute(
        select(m.Invoice)
        .options(selectinload(m.Invoice.client), selectinload(m.Invoice.items))
        .where(m.Invoice.invoice_id == invoice_id, m.Invoice.user_id == user_id)
    )
    return result.scalars().first()


async def update_invoice(session: AsyncSession, invoice_id: int, data: s.InvoiceUpdateSchema, user_id: int) -> m.Invoice | None:
    invoice = await get_invoice(session, invoice_id, user_id)
    if not invoice:
        return None
    invoice.client_id = data.client_id
    invoice.issued_at = data.issued_at
    invoice.due_at = data.due_at
    invoice.notes = data.notes

    for item in invoice.items:
        await session.delete(item)
    await session.flush()

    for item_data in data.items:
        item = m.InvoiceItem(invoice_id=invoice.invoice_id, **item_data.model_dump())
        session.add(item)

    await session.commit()
    await session.refresh(invoice)
    return invoice


async def patch_invoice_status(session: AsyncSession, invoice_id: int, status: str, user_id: int) -> m.Invoice | None:
    invoice = await get_invoice(session, invoice_id, user_id)
    if not invoice:
        return None
    invoice.status = status
    await session.commit()
    await session.refresh(invoice)
    return invoice


async def delete_invoice(session: AsyncSession, invoice_id: int, user_id: int) -> m.Invoice | None:
    invoice = await get_invoice(session, invoice_id, user_id)
    if invoice:
        await session.delete(invoice)
        await session.commit()
    return invoice


# ===== Profile =====

async def get_profile(session: AsyncSession, user_id: int) -> m.Profile | None:
    result = await session.execute(
        select(m.Profile).where(m.Profile.user_id == user_id)
    )
    return result.scalars().first()


async def upsert_profile(session: AsyncSession, data: s.ProfileCreateSchema, user_id: int) -> m.Profile:
    profile = await get_profile(session, user_id)
    if profile:
        for k, v in data.model_dump().items():
            setattr(profile, k, v)
    else:
        profile = m.Profile(user_id=user_id, **data.model_dump())
        session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile
