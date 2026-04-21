import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const customerId = searchParams.get('customerId') || ''
    const supplierId = searchParams.get('supplierId') || ''
    const warehouseId = searchParams.get('warehouseId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const q = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status
    if (customerId) where.customerId = customerId
    if (supplierId) where.supplierId = supplierId
    if (warehouseId) where.warehouseId = warehouseId

    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom)
      if (dateTo) {
        const end = new Date(dateTo)
        end.setDate(end.getDate() + 1)
        where.date.lt = end
      }
    }

    // Search by invoice number or customer/supplier name
    if (q) {
      where.OR = [
        { invoiceNo: { contains: q } },
        { customer: { name: { contains: q } } },
        { supplier: { name: { contains: q } } },
      ]
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          supplier: { select: { id: true, name: true, phone: true } },
          warehouse: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { name: true, sku: true } },
              unit: { select: { name: true, conversionFactor: true } },
            },
          },
          payments: true,
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.invoice.count({ where }),
    ])

    return NextResponse.json({ invoices, total, page, limit })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في جلب الفواتير' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, customerId, supplierId, warehouseId, date, items, discount, tax, notes, status, paidAmount, createdById } = body

    if (!type || !warehouseId || !items?.length) {
      return NextResponse.json({ error: 'نوع الفاتورة والمخزن والمواد مطلوبة' }, { status: 400 })
    }

    const validTypes = ['sale', 'purchase', 'sale_return', 'purchase_return']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'نوع الفاتورة غير صالح' }, { status: 400 })
    }

    // Generate sequential invoice number based on type
    const prefix =
      type === 'sale' ? 'SL' : type === 'purchase' ? 'PU' : type === 'sale_return' ? 'SR' : 'PR'

    const lastInvoice = await db.invoice.findFirst({
      where: { type },
      orderBy: { createdAt: 'desc' },
    })
    let nextNum = 1
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNo.split('-')
      nextNum = (parseInt(parts[parts.length - 1]) || 0) + 1
    }
    const invoiceNo = `${prefix}-${String(nextNum).padStart(3, '0')}`

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0),
      0
    )
    const discountAmount = parseFloat(discount) || 0
    const taxAmount = parseFloat(tax) || 0
    const totalAmount = subtotal - discountAmount + taxAmount
    const paid = parseFloat(paidAmount) || 0

    // Create invoice with items in a transaction
    const invoice = await db.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          type,
          invoiceNo,
          customerId: customerId || null,
          supplierId: supplierId || null,
          warehouseId,
          date: date ? new Date(date) : new Date(),
          subtotal,
          discount: discountAmount,
          tax: taxAmount,
          total: totalAmount,
          paidAmount: paid,
          notes: notes || null,
          status: status || 'draft',
          createdById: createdById || null,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              unitId: item.unitId || null,
              productName: item.productName,
              unitName: item.unitName || null,
              quantity: parseFloat(item.quantity) || 0,
              price: parseFloat(item.price) || 0,
              total: (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0),
              costPrice: parseFloat(item.costPrice) || 0,
            })),
          },
        },
        include: {
          items: true,
          customer: true,
          supplier: true,
          warehouse: true,
        },
      })

      // Update stock for confirmed invoices
      if (status === 'confirmed') {
        for (const item of items) {
          const qty = parseFloat(item.quantity) || 0
          let unitConversionFactor = 1

          // Get the conversion factor from the unit
          if (item.unitId) {
            const unit = await tx.productUnit.findUnique({
              where: { id: item.unitId },
              select: { conversionFactor: true },
            })
            if (unit) {
              unitConversionFactor = unit.conversionFactor
            }
          }

          // Stock adjustment: multiply by conversion factor
          const stockQty = qty * unitConversionFactor
          const stockAdj =
            type === 'sale' || type === 'purchase_return'
              ? -stockQty  // subtract for sale and purchase return
              : stockQty    // add for purchase and sale return

          // Find or create stock record (for default unit)
          const existingStock = await tx.warehouseStock.findFirst({
            where: {
              warehouseId,
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
                warehouseId,
                productId: item.productId,
                unitId: item.unitId || null,
                quantity: stockAdj,
                minStock: 0,
              },
            })
          }
        }

        // Update customer balance for sales
        if (customerId && (type === 'sale' || type === 'sale_return')) {
          const balanceAdj =
            type === 'sale'
              ? totalAmount - paid      // customer owes more
              : -(totalAmount - paid)   // return reduces balance
          await tx.customer.update({
            where: { id: customerId },
            data: { balance: { increment: balanceAdj } },
          })
        }

        // Update supplier balance for purchases
        if (supplierId && (type === 'purchase' || type === 'purchase_return')) {
          const balanceAdj =
            type === 'purchase'
              ? totalAmount - paid      // we owe supplier
              : -(totalAmount - paid)   // return reduces what we owe
          await tx.supplier.update({
            where: { id: supplierId },
            data: { balance: { increment: balanceAdj } },
          })
        }
      }

      // Create payment if paid amount > 0
      if (paid > 0 && status === 'confirmed') {
        await tx.payment.create({
          data: {
            invoiceId: inv.id,
            customerId: customerId || null,
            supplierId: supplierId || null,
            amount: paid,
            method: 'cash',
            date: date ? new Date(date) : new Date(),
            notes: `دفعة على فاتورة ${invoiceNo}`,
          },
        })
      }

      return inv
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في إنشاء الفاتورة' }, { status: 400 })
  }
}
