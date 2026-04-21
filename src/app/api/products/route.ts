import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { isActive: true }
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { barcode: { contains: q } },
      ]
    }
    if (categoryId) {
      where.categoryId = categoryId
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          units: true,
          stocks: {
            include: {
              warehouse: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ])

    // Add stock aggregate to each product
    const productsWithStock = products.map((p) => {
      const totalQty = p.stocks.reduce((sum, s) => sum + s.quantity, 0)
      const lowStock = p.stocks.some((s) => s.quantity <= s.minStock)
      return {
        ...p,
        totalStock: totalQty,
        lowStock,
      }
    })

    return NextResponse.json({ products: productsWithStock, total, page, limit })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في جلب المنتجات' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, sku, barcode, categoryId, description, costPrice, sellPrice, units } = body

    if (!name) {
      return NextResponse.json({ error: 'اسم المنتج مطلوب' }, { status: 400 })
    }

    const product = await db.product.create({
      data: {
        name,
        sku: sku || null,
        barcode: barcode || null,
        categoryId: categoryId || null,
        description: description || null,
        costPrice: parseFloat(costPrice) || 0,
        sellPrice: parseFloat(sellPrice) || 0,
        units: units?.length
          ? {
              create: units.map((u: any, i: number) => ({
                name: u.name,
                barcode: u.barcode || null,
                conversionFactor: parseFloat(u.conversionFactor) || 1,
                costPrice: parseFloat(u.costPrice) || 0,
                sellPrice: parseFloat(u.sellPrice) || 0,
                isDefault: i === 0,
              })),
            }
          : undefined,
      },
      include: { units: true, category: true },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في إنشاء المنتج' }, { status: 400 })
  }
}
