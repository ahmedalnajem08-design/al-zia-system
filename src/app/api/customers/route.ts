import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const withBalances = searchParams.get('withBalances') === 'true'

    const where: any = { isActive: true }
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
        { taxNumber: { contains: q } },
      ]
    }

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { invoices: true, payments: true } },
        },
      }),
      db.customer.count({ where }),
    ])

    // If withBalances is true, aggregate invoice totals and payment totals per customer
    if (withBalances) {
      const customerIds = customers.map((c) => c.id)

      // Get total sales (sale invoices) per customer
      const salesAgg = await db.invoice.groupBy({
        by: ['customerId'],
        where: {
          customerId: { in: customerIds },
          type: { in: ['sale', 'sale_return'] },
          status: { in: ['confirmed', 'draft'] },
        },
        _sum: { total: true, paidAmount: true },
      })

      // Get total payments per customer
      const paymentsAgg = await db.payment.groupBy({
        by: ['customerId'],
        where: {
          customerId: { in: customerIds },
        },
        _sum: { amount: true },
      })

      const salesMap = new Map<string, { total: number; paidAmount: number }>()
      salesAgg.forEach((item) => {
        if (item.customerId) {
          salesMap.set(item.customerId, {
            total: item._sum.total || 0,
            paidAmount: item._sum.paidAmount || 0,
          })
        }
      })

      const paymentsMap = new Map<string, number>()
      paymentsAgg.forEach((item) => {
        if (item.customerId) {
          paymentsMap.set(item.customerId, item._sum.amount || 0)
        }
      })

      const enrichedCustomers = customers.map((c) => {
        const sales = salesMap.get(c.id) || { total: 0, paidAmount: 0 }
        const payments = paymentsMap.get(c.id) || 0
        return {
          ...c,
          totalSales: sales.total,
          totalPayments: payments,
        }
      })

      return NextResponse.json({ customers: enrichedCustomers, total, page, limit })
    }

    return NextResponse.json({ customers, total, page, limit })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في جلب الزبائن' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, address, email, taxNumber, notes } = body

    if (!name) {
      return NextResponse.json({ error: 'اسم الزبون مطلوب' }, { status: 400 })
    }

    const customer = await db.customer.create({
      data: {
        name,
        phone: phone || null,
        address: address || null,
        email: email || null,
        taxNumber: taxNumber || null,
        notes: notes || null,
      },
    })
    return NextResponse.json(customer, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في إنشاء الزبون' }, { status: 400 })
  }
}
