import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        supplier: true,
        warehouse: true,
        items: {
          include: {
            product: { select: { name: true, sku: true, category: { select: { name: true } } } },
            unit: { select: { name: true, conversionFactor: true } },
          },
        },
        payments: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في جلب الفاتورة' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, paidAmount, notes, discount, tax } = body

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!invoice) {
      return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 })
    }

    // Validate status transitions
    if (status && invoice.status === 'cancelled') {
      return NextResponse.json({ error: 'لا يمكن تعديل فاتورة ملغاة' }, { status: 400 })
    }

    const updated = await db.$transaction(async (tx) => {
      // === Confirming a draft invoice ===
      if (status === 'confirmed' && invoice.status === 'draft') {
        for (const item of invoice.items) {
          const qty = item.quantity
          let unitConversionFactor = 1

          if (item.unitId) {
            const unit = await tx.productUnit.findUnique({
              where: { id: item.unitId },
              select: { conversionFactor: true },
            })
            if (unit) unitConversionFactor = unit.conversionFactor
          }

          const stockQty = qty * unitConversionFactor
          const stockAdj =
            invoice.type === 'sale' || invoice.type === 'purchase_return'
              ? -stockQty
              : stockQty

          const existingStock = await tx.warehouseStock.findFirst({
            where: {
              warehouseId: invoice.warehouseId,
              productId: item.productId,
              unitId: item.unitId || null,
            },
          })

          if (existingStock) {
            await tx.warehouseStock.update({
              where: { id: existingStock.id },
              data: { quantity: { increment: stockAdj } },
            })
          } else {
            await tx.warehouseStock.create({
              data: {
                warehouseId: invoice.warehouseId,
                productId: item.productId,
                unitId: item.unitId || null,
                quantity: stockAdj,
                minStock: 0,
              },
            })
          }
        }

        // Update balances
        if (invoice.customerId && (invoice.type === 'sale' || invoice.type === 'sale_return')) {
          const balanceAdj =
            invoice.type === 'sale'
              ? invoice.total - invoice.paidAmount
              : -(invoice.total - invoice.paidAmount)
          await tx.customer.update({
            where: { id: invoice.customerId },
            data: { balance: { increment: balanceAdj } },
          })
        }
        if (invoice.supplierId && (invoice.type === 'purchase' || invoice.type === 'purchase_return')) {
          const balanceAdj =
            invoice.type === 'purchase'
              ? invoice.total - invoice.paidAmount
              : -(invoice.total - invoice.paidAmount)
          await tx.supplier.update({
            where: { id: invoice.supplierId },
            data: { balance: { increment: balanceAdj } },
          })
        }
      }

      // === Cancelling a confirmed invoice ===
      if (status === 'cancelled' && invoice.status === 'confirmed') {
        for (const item of invoice.items) {
          const qty = item.quantity
          let unitConversionFactor = 1

          if (item.unitId) {
            const unit = await tx.productUnit.findUnique({
              where: { id: item.unitId },
              select: { conversionFactor: true },
            })
            if (unit) unitConversionFactor = unit.conversionFactor
          }

          const stockQty = qty * unitConversionFactor
          // Reverse the stock operation
          const stockAdj =
            invoice.type === 'sale' || invoice.type === 'purchase_return'
              ? stockQty    // add back for sale
              : -stockQty   // subtract back for purchase

          const existingStock = await tx.warehouseStock.findFirst({
            where: {
              warehouseId: invoice.warehouseId,
              productId: item.productId,
              unitId: item.unitId || null,
            },
          })

          if (existingStock) {
            await tx.warehouseStock.update({
              where: { id: existingStock.id },
              data: { quantity: { increment: stockAdj } },
            })
          }
        }

        // Reverse balance
        if (invoice.customerId && (invoice.type === 'sale' || invoice.type === 'sale_return')) {
          const balanceAdj =
            invoice.type === 'sale'
              ? -(invoice.total - invoice.paidAmount)
              : invoice.total - invoice.paidAmount
          await tx.customer.update({
            where: { id: invoice.customerId },
            data: { balance: { increment: balanceAdj } },
          })
        }
        if (invoice.supplierId && (invoice.type === 'purchase' || invoice.type === 'purchase_return')) {
          const balanceAdj =
            invoice.type === 'purchase'
              ? -(invoice.total - invoice.paidAmount)
              : invoice.total - invoice.paidAmount
          await tx.supplier.update({
            where: { id: invoice.supplierId },
            data: { balance: { increment: balanceAdj } },
          })
        }
      }

      // Update the invoice
      const data: any = {}
      if (status !== undefined) data.status = status
      if (paidAmount !== undefined) data.paidAmount = parseFloat(paidAmount) || 0
      if (notes !== undefined) data.notes = notes || null
      if (discount !== undefined) data.discount = parseFloat(discount) || 0
      if (tax !== undefined) data.tax = parseFloat(tax) || 0

      return tx.invoice.update({
        where: { id },
        data,
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true } },
              unit: { select: { name: true, conversionFactor: true } },
            },
          },
          customer: true,
          supplier: true,
          warehouse: true,
          payments: true,
        },
      })
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في تحديث الفاتورة' }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await db.invoice.findUnique({ where: { id } })
    if (!invoice) {
      return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 })
    }

    if (invoice.status === 'confirmed') {
      return NextResponse.json({ error: 'لا يمكن حذف فاتورة مؤكدة، قم بإلغائها أولاً' }, { status: 400 })
    }

    await db.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { invoiceId: id } })
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } })
      await tx.invoice.delete({ where: { id } })
    })

    return NextResponse.json({ message: 'تم حذف الفاتورة بنجاح' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في حذف الفاتورة' }, { status: 500 })
  }
}
