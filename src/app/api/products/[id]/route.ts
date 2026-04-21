import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        units: true,
        stocks: {
          include: { warehouse: true, unit: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 })
    }

    // Add stock aggregates
    const totalStock = product.stocks.reduce((sum, s) => sum + s.quantity, 0)
    const lowStock = product.stocks.some((s) => s.quantity <= s.minStock)

    return NextResponse.json({ ...product, totalStock, lowStock })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في جلب المنتج' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, sku, barcode, categoryId, description, costPrice, sellPrice, isActive, units } = body

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 })
    }

    // If units provided, delete existing and replace
    if (units !== undefined) {
      await db.productUnit.deleteMany({ where: { productId: id } })
    }

    const product = await db.product.update({
      where: { id },
      data: {
        name: name ?? undefined,
        sku: sku !== undefined ? sku : undefined,
        barcode: barcode !== undefined ? barcode : undefined,
        categoryId: categoryId !== undefined ? categoryId || null : undefined,
        description: description !== undefined ? description : undefined,
        costPrice: costPrice !== undefined ? parseFloat(costPrice) || 0 : undefined,
        sellPrice: sellPrice !== undefined ? parseFloat(sellPrice) || 0 : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
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

    return NextResponse.json(product)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في تحديث المنتج' }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 })
    }

    await db.product.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ message: 'تم حذف المنتج بنجاح' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في حذف المنتج' }, { status: 500 })
  }
}
