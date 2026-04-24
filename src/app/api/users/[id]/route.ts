import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في جلب المستخدم' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, role, isActive, password } = body

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // Check name uniqueness if changed
    if (name && name !== existing.name) {
      const nameExists = await db.user.findFirst({ where: { name } })
      if (nameExists) {
        return NextResponse.json({ error: 'اسم المستخدم موجود مسبقاً' }, { status: 400 })
      }
    }

    const data: any = {}
    if (name !== undefined) data.name = name
    if (role !== undefined) data.role = role
    if (isActive !== undefined) data.isActive = isActive
    if (password !== undefined) data.password = password

    const user = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في تحديث المستخدم' }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    if (existing.role === 'admin') {
      return NextResponse.json({ error: 'لا يمكن حذف مدير النظام' }, { status: 400 })
    }

    await db.user.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ message: 'تم حذف المستخدم بنجاح' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في حذف المستخدم' }, { status: 500 })
  }
}
