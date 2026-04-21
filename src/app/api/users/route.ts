import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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
    const { name, email, password, phone, role } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'الاسم والبريد وكلمة المرور مطلوبة' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'البريد الإلكتروني موجود مسبقاً' }, { status: 400 })
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        password, // Plain text for demo
        phone: phone || null,
        role: role || 'user',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
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
