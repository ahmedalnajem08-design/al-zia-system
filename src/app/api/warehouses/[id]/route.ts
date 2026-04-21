import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, address, phone, notes, isActive } = body

    const existing = await db.warehouse.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'المخزن غير موجود' }, { status: 404 })
    }

    const warehouse = await db.warehouse.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        address: address !== undefined ? address : undefined,
        phone: phone !== undefined ? phone : undefined,
        notes: notes !== undefined ? notes : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      include: {
        _count: { select: { stocks: true, invoices: true } },
      },
    })
    return NextResponse.json(warehouse)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في تحديث المخزن' }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.warehouse.findUnique({
      where: { id },
      include: { _count: { select: { stocks: true, invoices: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'المخزن غير موجود' }, { status: 404 })
    }

    // Only delete if no stocks or invoices
    if (existing._count.stocks > 0 || existing._count.invoices > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف مخزن يحتوي على مخزون أو فواتير' },
        { status: 400 }
      )
    }

    await db.warehouse.delete({ where: { id } })
    return NextResponse.json({ message: 'تم حذف المخزن بنجاح' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في حذف المخزن' }, { status: 500 })
  }
}
