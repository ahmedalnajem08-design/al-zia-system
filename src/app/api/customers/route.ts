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

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { invoices: true, payments: true } },
        },
      }),
      db.customer.count({ where }),
    ])

    return NextResponse.json({ customers, total, page, limit })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في جلب الزبائن' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, address, email, taxNumber, notes } = body

    if (!name) {
      return NextResponse.json({ error: 'اسم الزبون مطلوب' }, { status: 400 })
    }

    const customer = await db.customer.create({
      data: {
        name,
        phone: phone || null,
        address: address || null,
        email: email || null,
        taxNumber: taxNumber || null,
        notes: notes || null,
      },
    })
    return NextResponse.json(customer, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في إنشاء الزبون' }, { status: 400 })
  }
}
