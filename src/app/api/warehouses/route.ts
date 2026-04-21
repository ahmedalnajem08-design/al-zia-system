import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const warehouses = await db.warehouse.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { stocks: true, invoices: true },
        },
      },
    })
    return NextResponse.json(warehouses)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في جلب المخازن' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, address, phone, notes } = body

    if (!name) {
      return NextResponse.json({ error: 'اسم المخزن مطلوب' }, { status: 400 })
    }

    const warehouse = await db.warehouse.create({
      data: {
        name,
        address: address || null,
        phone: phone || null,
        notes: notes || null,
      },
      include: {
        _count: { select: { stocks: true, invoices: true } },
      },
    })
    return NextResponse.json(warehouse, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في إنشاء المخزن' }, { status: 400 })
  }
}
