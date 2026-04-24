import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })
    return NextResponse.json(users)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في جلب المستخدمين' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, password, role } = body

    if (!name || !password) {
      return NextResponse.json({ error: 'الاسم وكلمة المرور مطلوبان' }, { status: 400 })
    }

    const existing = await db.user.findFirst({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'اسم المستخدم موجود مسبقاً' }, { status: 400 })
    }

    const user = await db.user.create({
      data: {
        name,
        password,
        role: role || 'user',
      },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في إنشاء المستخدم' }, { status: 400 })
  }
}
