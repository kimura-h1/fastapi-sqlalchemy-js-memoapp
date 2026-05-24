from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import db
import cruds.invoice as crud
import schemas.invoice as s
from auth import get_current_user
import models.user as user_model
import models.invoice as m

router = APIRouter(tags=["Invoices"], prefix="/invoices")


# ===== 変換ヘルパー =====

def to_item_schema(item: m.InvoiceItem) -> s.InvoiceItemSchema:
    subtotal = Decimal(str(item.unit_price)) * item.quantity
    tax_amount = (subtotal * Decimal(str(item.tax_rate))).quantize(Decimal("1"))
    return s.InvoiceItemSchema(
        item_id=item.item_id,
        name=item.name,
        quantity=item.quantity,
        unit_price=Decimal(str(item.unit_price)),
        tax_rate=Decimal(str(item.tax_rate)),
        subtotal=subtotal,
        tax_amount=tax_amount,
        total=subtotal + tax_amount,
    )


def to_invoice_schema(invoice: m.Invoice) -> s.InvoiceSchema:
    items = [to_item_schema(i) for i in invoice.items]
    subtotal = sum(i.subtotal for i in items)
    tax_amount = sum(i.tax_amount for i in items)
    return s.InvoiceSchema(
        invoice_id=invoice.invoice_id,
        invoice_number=invoice.invoice_number,
        client_id=invoice.client_id,
        client_name=invoice.client.name,
        issued_at=invoice.issued_at,
        due_at=invoice.due_at,
        status=invoice.status,
        notes=invoice.notes,
        items=items,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total=subtotal + tax_amount,
        created_at=invoice.created_at,
    )


def to_invoice_list_schema(invoice: m.Invoice) -> s.InvoiceListSchema:
    items = [to_item_schema(i) for i in invoice.items]
    total = sum(i.total for i in items)
    return s.InvoiceListSchema(
        invoice_id=invoice.invoice_id,
        invoice_number=invoice.invoice_number,
        client_name=invoice.client.name,
        issued_at=invoice.issued_at,
        due_at=invoice.due_at,
        status=invoice.status,
        total=total,
        created_at=invoice.created_at,
    )


# ===== 取引先 =====

@router.get("/clients", response_model=list[s.ClientSchema])
async def list_clients(
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    return await crud.get_clients(session, current_user.user_id)


@router.post("/clients", response_model=s.ClientSchema, status_code=201)
async def create_client(
    data: s.ClientCreateSchema,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    return await crud.create_client(session, data, current_user.user_id)


@router.put("/clients/{client_id}", response_model=s.ClientSchema)
async def update_client(
    client_id: int,
    data: s.ClientCreateSchema,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    client = await crud.update_client(session, client_id, data, current_user.user_id)
    if not client:
        raise HTTPException(status_code=404, detail="取引先が見つかりません")
    return client


@router.delete("/clients/{client_id}", status_code=204)
async def delete_client(
    client_id: int,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    result = await crud.delete_client(session, client_id, current_user.user_id)
    if not result:
        raise HTTPException(status_code=404, detail="取引先が見つかりません")


# ===== 品目テンプレート =====

@router.get("/templates", response_model=list[s.ItemTemplateSchema])
async def list_templates(
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    return await crud.get_templates(session, current_user.user_id)


@router.post("/templates", response_model=s.ItemTemplateSchema, status_code=201)
async def create_template(
    data: s.ItemTemplateCreateSchema,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    return await crud.create_template(session, data, current_user.user_id)


@router.delete("/templates/{template_id}", status_code=204)
async def delete_template(
    template_id: int,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    result = await crud.delete_template(session, template_id, current_user.user_id)
    if not result:
        raise HTTPException(status_code=404, detail="テンプレートが見つかりません")


# ===== 請求書 =====

@router.get("/", response_model=list[s.InvoiceListSchema])
async def list_invoices(
    status: str | None = None,
    client_id: int | None = None,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    invoices = await crud.get_invoices(session, current_user.user_id, status=status, client_id=client_id)
    return [to_invoice_list_schema(inv) for inv in invoices]


@router.post("/", response_model=s.InvoiceSchema, status_code=201)
async def create_invoice(
    data: s.InvoiceCreateSchema,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    invoice = await crud.create_invoice(session, data, current_user.user_id)
    invoice = await crud.get_invoice(session, invoice.invoice_id, current_user.user_id)
    return to_invoice_schema(invoice)


@router.get("/{invoice_id}", response_model=s.InvoiceSchema)
async def get_invoice(
    invoice_id: int,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    invoice = await crud.get_invoice(session, invoice_id, current_user.user_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="請求書が見つかりません")
    return to_invoice_schema(invoice)


@router.put("/{invoice_id}", response_model=s.InvoiceSchema)
async def update_invoice(
    invoice_id: int,
    data: s.InvoiceUpdateSchema,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    invoice = await crud.update_invoice(session, invoice_id, data, current_user.user_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="請求書が見つかりません")
    invoice = await crud.get_invoice(session, invoice_id, current_user.user_id)
    return to_invoice_schema(invoice)


@router.patch("/{invoice_id}/status", response_model=s.InvoiceSchema)
async def patch_status(
    invoice_id: int,
    data: s.InvoicePatchSchema,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    invoice = await crud.patch_invoice_status(session, invoice_id, data.status, current_user.user_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="請求書が見つかりません")
    invoice = await crud.get_invoice(session, invoice_id, current_user.user_id)
    return to_invoice_schema(invoice)


@router.delete("/{invoice_id}", status_code=204)
async def delete_invoice(
    invoice_id: int,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    result = await crud.delete_invoice(session, invoice_id, current_user.user_id)
    if not result:
        raise HTTPException(status_code=404, detail="請求書が見つかりません")


# ===== プロフィール =====

@router.get("/profile/me", response_model=s.ProfileSchema | None)
async def get_profile(
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    return await crud.get_profile(session, current_user.user_id)


@router.put("/profile/me", response_model=s.ProfileSchema)
async def upsert_profile(
    data: s.ProfileCreateSchema,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    return await crud.upsert_profile(session, data, current_user.user_id)
