import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const warehouses = await db.warehouse.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        stocks: {
          include: {
            product: { select: { costPrice: true } },
          },
        },
        _count: {
          select: { stocks: true, invoices: true },
        },
      },
    })

    // Compute totalStockValue and productCount per warehouse
    const enriched = warehouses.map((w) => {
      let totalStockValue = 0
      for (const stock of w.stocks) {
        totalStockValue += stock.quantity * (stock.product?.costPrice ?? 0)
      }
      return {
        ...w,
        totalStockValue,
        productCount: w._count.stocks,
        stocks: undefined, // don't send stocks array in list view
      }
    })

    return NextResponse.json(enriched)
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

    const result = {
      ...warehouse,
      totalStockValue: 0,
      productCount: 0,
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في إنشاء المخزن' }, { status: 400 })
  }
}
