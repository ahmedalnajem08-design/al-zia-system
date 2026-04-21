import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId') || ''
    const supplierId = searchParams.get('supplierId') || ''
    const invoiceId = searchParams.get('invoiceId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const where: any = {}
    if (customerId) where.customerId = customerId
    if (supplierId) where.supplierId = supplierId
    if (invoiceId) where.invoiceId = invoiceId

    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom)
      if (dateTo) {
        const end = new Date(dateTo)
        end.setDate(end.getDate() + 1)
        where.date.lt = end
      }
    }

    const payments = await db.payment.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        invoice: { select: { id: true, invoiceNo: true, type: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(payments)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في جلب المدفوعات' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, supplierId, invoiceId, amount, method, date, notes } = body

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'المبلغ مطلوب ويجب أن يكون أكبر من صفر' }, { status: 400 })
    }

    if (!customerId && !supplierId) {
      return NextResponse.json({ error: 'يجب تحديد زبون أو مجهز' }, { status: 400 })
    }

    const payment = await db.$transaction(async (tx) => {
      const pay = await tx.payment.create({
        data: {
          customerId: customerId || null,
          supplierId: supplierId || null,
          invoiceId: invoiceId || null,
          amount: parseFloat(amount),
          method: method || 'cash',
          date: date ? new Date(date) : new Date(),
          notes: notes || null,
        },
        include: {
          customer: { select: { name: true } },
          supplier: { select: { name: true } },
          invoice: { select: { invoiceNo: true, type: true } },
        },
      })

      // Update customer balance (payment reduces debt)
      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: { balance: { decrement: parseFloat(amount) } },
        })
      }

      // Update supplier balance (payment reduces what we owe)
      if (supplierId) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: { balance: { decrement: parseFloat(amount) } },
        })
      }

      // Update invoice paid amount
      if (invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } })
        if (invoice) {
          await tx.invoice.update({
            where: { id: invoiceId },
            data: { paidAmount: { increment: parseFloat(amount) } },
          })
        }
      }

      return pay
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في إنشاء الدفعة' }, { status: 400 })
  }
}
