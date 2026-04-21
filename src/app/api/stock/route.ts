import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get('warehouseId') || ''
    const productId = searchParams.get('productId') || ''
    const lowStock = searchParams.get('lowStock') === 'true'

    const where: any = {}
    if (warehouseId) where.warehouseId = warehouseId
    if (productId) where.productId = productId
    if (lowStock) {
      where.quantity = { lte: db.warehouseStock.fields.minStock }
    }

    const stocks = await db.warehouseStock.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true } },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            category: { select: { name: true } },
          },
        },
        unit: { select: { id: true, name: true, conversionFactor: true } },
      },
      orderBy: { product: { name: 'asc' } },
    })

    return NextResponse.json(stocks)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في جلب المخزون' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { stockId, quantity, minStock } = body

    if (!stockId) {
      return NextResponse.json({ error: 'معرف السجل مطلوب' }, { status: 400 })
    }

    const existing = await db.warehouseStock.findUnique({ where: { id: stockId } })
    if (!existing) {
      return NextResponse.json({ error: 'سجل المخزون غير موجود' }, { status: 404 })
    }

    const data: any = {}
    if (quantity !== undefined) data.quantity = parseFloat(quantity) || 0
    if (minStock !== undefined) data.minStock = parseFloat(minStock) || 0

    const stock = await db.warehouseStock.update({
      where: { id: stockId },
      data,
      include: {
        warehouse: { select: { name: true } },
        product: { select: { name: true } },
        unit: { select: { name: true } },
      },
    })

    return NextResponse.json(stock)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في تحديث المخزون' }, { status: 400 })
  }
}
