import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/expenses/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const expense = await db.expense.findUnique({ where: { id } })
    if (!expense) {
      return NextResponse.json({ error: 'سند الصرف غير موجود' }, { status: 404 })
    }
    return NextResponse.json(expense)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/expenses/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const expense = await db.expense.findUnique({ where: { id } })
    if (!expense) {
      return NextResponse.json({ error: 'سند الصرف غير موجود' }, { status: 404 })
    }
    await db.expense.delete({ where: { id } })
    return NextResponse.json({ message: 'تم حذف سند الصرف بنجاح' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
