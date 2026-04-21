import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { isActive: true }
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
        { taxNumber: { contains: q } },
      ]
    }

    const [suppliers, total] = await Promise.all([
      db.supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { invoices: true, payments: true } },
        },
      }),
      db.supplier.count({ where }),
    ])

    return NextResponse.json({ suppliers, total, page, limit })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في جلب المجهزين' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, address, email, taxNumber, notes } = body

    if (!name) {
      return NextResponse.json({ error: 'اسم المجهز مطلوب' }, { status: 400 })
    }

    const supplier = await db.supplier.create({
      data: {
        name,
        phone: phone || null,
        address: address || null,
        email: email || null,
        taxNumber: taxNumber || null,
        notes: notes || null,
      },
    })
    return NextResponse.json(supplier, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في إنشاء المجهز' }, { status: 400 })
  }
}
