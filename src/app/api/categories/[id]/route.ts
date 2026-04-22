import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.productCategory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'التصنيف غير موجود' }, { status: 404 })
    }

    // Check if category has active products
    const productCount = await db.product.count({
      where: { categoryId: id, isActive: true },
    })
    if (productCount > 0) {
      return NextResponse.json(
        { error: `لا يمكن حذف التصنيف لوجود ${productCount} مادة مرتبطة به` },
        { status: 400 }
      )
    }

    await db.productCategory.delete({ where: { id } })
    return NextResponse.json({ message: 'تم حذف التصنيف بنجاح' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في حذف التصنيف' }, { status: 500 })
  }
}
