import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, password } = body

    if (!name || !password) {
      return NextResponse.json({ error: 'الاسم وكلمة المرور مطلوبان' }, { status: 400 })
    }

    const user = await db.user.findFirst({
      where: {
        name,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
        password: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'اسم المستخدم غير موجود أو غير نشط' }, { status: 401 })
    }

    if (user.password !== password) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 })
    }

    // Return user data without password
    const { password: _, ...userData } = user
    return NextResponse.json(userData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في تسجيل الدخول' }, { status: 500 })
  }
}
