import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/vouchers/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const voucher = await db.voucher.findUnique({
      where: { id },
      include: {
        customer: true,
        supplier: true,
      },
    })
    if (!voucher) {
      return NextResponse.json({ error: 'السند غير موجود' }, { status: 404 })
    }
    return NextResponse.json(voucher)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/vouchers/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const voucher = await db.voucher.findUnique({ where: { id } })
    if (!voucher) {
      return NextResponse.json({ error: 'السند غير موجود' }, { status: 404 })
    }

    // Reverse the balance effect
    if (voucher.customerId && voucher.type === 'receipt') {
      await db.customer.update({
        where: { id: voucher.customerId },
        data: { balance: { increment: voucher.amount } },
      })
    }
    if (voucher.supplierId && voucher.type === 'payment') {
      await db.supplier.update({
        where: { id: voucher.supplierId },
        data: { balance: { increment: voucher.amount } },
      })
    }

    await db.voucher.delete({ where: { id } })
    return NextResponse.json({ message: 'تم حذف السند بنجاح' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
