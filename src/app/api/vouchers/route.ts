import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/vouchers - List vouchers with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'receipt' or 'payment'
    const customerId = searchParams.get('customerId')
    const supplierId = searchParams.get('supplierId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (type) where.type = type
    if (customerId) where.customerId = customerId
    if (supplierId) where.supplierId = supplierId
    if (fromDate || toDate) {
      where.date = {}
      if (fromDate) where.date.gte = new Date(fromDate)
      if (toDate) where.date.lte = new Date(toDate + 'T23:59:59')
    }

    const [vouchers, total] = await Promise.all([
      db.voucher.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          supplier: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.voucher.count({ where }),
    ])

    return NextResponse.json({ vouchers, total, page, limit })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/vouchers - Create a new voucher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, customerId, supplierId, amount, method, description, date, notes } = body

    if (!type || !amount || amount <= 0) {
      return NextResponse.json({ error: 'بيانات السند غير مكتملة' }, { status: 400 })
    }

    if (type === 'receipt' && !customerId) {
      return NextResponse.json({ error: 'يجب اختيار الزبون لسند القبض' }, { status: 400 })
    }

    if (type === 'payment' && !supplierId) {
      return NextResponse.json({ error: 'يجب اختيار المجهز لسند الدفع' }, { status: 400 })
    }

    // Generate voucher number
    const prefix = type === 'receipt' ? 'RCP' : 'PAY'
    const count = await db.voucher.count({ where: { type } })
    const voucherNo = `${prefix}-${String(count + 1).padStart(4, '0')}`

    // Create voucher
    const voucher = await db.voucher.create({
      data: {
        voucherNo,
        type,
        customerId: customerId || null,
        supplierId: supplierId || null,
        amount,
        method: method || 'cash',
        description: description || null,
        date: date ? new Date(date) : new Date(),
        notes: notes || null,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        supplier: { select: { id: true, name: true, phone: true } },
      },
    })

    // Update customer/supplier balance
    if (customerId && type === 'receipt') {
      await db.customer.update({
        where: { id: customerId },
        data: { balance: { decrement: amount } },
      })
    }
    if (supplierId && type === 'payment') {
      await db.supplier.update({
        where: { id: supplierId },
        data: { balance: { decrement: amount } },
      })
    }

    return NextResponse.json(voucher, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
