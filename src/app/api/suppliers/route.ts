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

    const [suppliers, total] = await Promise.all([
      db.supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { invoices: true, payments: true } },
        },
      }),
      db.supplier.count({ where }),
    ])

    // If withBalances is true, aggregate invoice totals and payment totals per supplier
    if (withBalances) {
      const supplierIds = suppliers.map((s) => s.id)

      // Get total purchases (purchase invoices) per supplier
      const purchasesAgg = await db.invoice.groupBy({
        by: ['supplierId'],
        where: {
          supplierId: { in: supplierIds },
          type: { in: ['purchase', 'purchase_return'] },
          status: { in: ['confirmed', 'draft'] },
        },
        _sum: { total: true, paidAmount: true },
      })

      // Get total payments per supplier
      const paymentsAgg = await db.payment.groupBy({
        by: ['supplierId'],
        where: {
          supplierId: { in: supplierIds },
        },
        _sum: { amount: true },
      })

      const purchasesMap = new Map<string, { total: number; paidAmount: number }>()
      purchasesAgg.forEach((item) => {
        if (item.supplierId) {
          purchasesMap.set(item.supplierId, {
            total: item._sum.total || 0,
            paidAmount: item._sum.paidAmount || 0,
          })
        }
      })

      const paymentsMap = new Map<string, number>()
      paymentsAgg.forEach((item) => {
        if (item.supplierId) {
          paymentsMap.set(item.supplierId, item._sum.amount || 0)
        }
      })

      const enrichedSuppliers = suppliers.map((s) => {
        const purchases = purchasesMap.get(s.id) || { total: 0, paidAmount: 0 }
        const payments = paymentsMap.get(s.id) || 0
        return {
          ...s,
          totalPurchases: purchases.total,
          totalPayments: payments,
        }
      })

      return NextResponse.json({ suppliers: enrichedSuppliers, total, page, limit })
    }

    return NextResponse.json({ suppliers, total, page, limit })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في جلب المجهزين' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, address, email, taxNumber, notes } = body

    if (!name) {
      return NextResponse.json({ error: 'اسم المجهز مطلوب' }, { status: 400 })
    }

    const supplier = await db.supplier.create({
      data: {
        name,
        phone: phone || null,
        address: address || null,
        email: email || null,
        taxNumber: taxNumber || null,
        notes: notes || null,
      },
    })
    return NextResponse.json(supplier, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في إنشاء المجهز' }, { status: 400 })
  }
}
