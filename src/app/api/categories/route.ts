import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const categories = await db.productCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    })
    return NextResponse.json(categories)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في جلب التصنيفات' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'اسم التصنيف مطلوب' }, { status: 400 })
    }

    const category = await db.productCategory.create({ data: { name } })
    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في إنشاء التصنيف' }, { status: 400 })
  }
}
