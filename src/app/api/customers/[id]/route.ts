import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        _count: { select: { invoices: true, payments: true } },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'الزبون غير موجود' }, { status: 404 })
    }

    // Get all invoices for account statement
    const invoices = await db.invoice.findMany({
      where: {
        customerId: id,
        status: 'confirmed',
      },
      orderBy: { date: 'asc' },
      include: {
        items: { select: { productName: true, quantity: true, price: true, total: true } },
        warehouse: { select: { name: true } },
      },
    })

    // Get all payments
    const payments = await db.payment.findMany({
      where: { customerId: id },
      orderBy: { date: 'asc' },
    })

    // Build account statement transactions
    const transactions: any[] = []
    let runningBalance = 0

    const allEvents: any[] = [
      ...invoices.map((inv) => ({
        date: inv.date,
        type: inv.type === 'sale_return' ? 'credit' : 'debit',
        invoiceNo: inv.invoiceNo,
        description:
          inv.type === 'sale'
            ? `فاتورة بيع ${inv.invoiceNo}`
            : inv.type === 'sale_return'
            ? `إرجاع بيع ${inv.invoiceNo}`
            : `فاتورة ${inv.invoiceNo}`,
        amount: inv.total,
        paidAmount: inv.paidAmount,
      })),
      ...payments.map((pay) => ({
        date: pay.date,
        type: 'credit',
        invoiceNo: null,
        description: `دفعة - ${pay.method === 'cash' ? 'نقدي' : pay.method === 'card' ? 'بطاقة' : 'تحويل'}`,
        amount: pay.amount,
        paidAmount: 0,
      })),
    ]

    allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    for (const event of allEvents) {
      if (event.type === 'debit') {
        runningBalance += event.amount - (event.paidAmount || 0)
        transactions.push({
          date: event.date,
          type: 'debit',
          invoiceNo: event.invoiceNo,
          description: event.description,
          debit: event.amount,
          credit: 0,
          balance: runningBalance,
        })
      } else {
        runningBalance -= event.amount
        transactions.push({
          date: event.date,
          type: 'credit',
          invoiceNo: event.invoiceNo,
          description: event.description,
          debit: 0,
          credit: event.amount,
          balance: runningBalance,
        })
      }
    }

    return NextResponse.json({
      customer,
      invoices,
      payments,
      transactions,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في جلب بيانات الزبون' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, phone, address, email, taxNumber, notes, isActive, balance } = body

    const existing = await db.customer.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'الزبون غير موجود' }, { status: 404 })
    }

    const data: any = {}
    if (name !== undefined) data.name = name
    if (phone !== undefined) data.phone = phone || null
    if (address !== undefined) data.address = address || null
    if (email !== undefined) data.email = email || null
    if (taxNumber !== undefined) data.taxNumber = taxNumber || null
    if (notes !== undefined) data.notes = notes || null
    if (isActive !== undefined) data.isActive = isActive
    if (balance !== undefined) data.balance = parseFloat(balance) || 0

    const customer = await db.customer.update({
      where: { id },
      data,
    })
    return NextResponse.json(customer)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في تحديث الزبون' }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.customer.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'الزبون غير موجود' }, { status: 404 })
    }

    // حذف الزبون نهائياً (مع cascade للعلاقات)
    await db.customer.delete({ where: { id } })
    return NextResponse.json({ message: 'تم حذف الزبون بنجاح' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في حذف الزبون' }, { status: 500 })
  }
}
