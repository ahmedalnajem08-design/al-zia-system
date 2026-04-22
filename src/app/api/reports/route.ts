import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Map report type parameter to invoice type
const typeMap: Record<string, string> = {
  sales: 'sale',
  purchases: 'purchase',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawType = searchParams.get('type') || 'sales'
    const type = typeMap[rawType] || rawType
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const groupBy = searchParams.get('groupBy') || 'date'

    // Build base where clause
    const where: any = {
      type,
      status: 'confirmed',
    }

    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom)
      if (dateTo) {
        const end = new Date(dateTo)
        end.setDate(end.getDate() + 1)
        where.date.lt = end
      }
    }

    // Summary aggregate
    const summary = await db.invoice.aggregate({
      where,
      _sum: { total: true, discount: true, tax: true, paidAmount: true, subtotal: true },
      _count: true,
    })

    // Get all invoices with items for detailed analysis
    const invoices = await db.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        warehouse: { select: { name: true } },
        items: {
          select: {
            productId: true,
            productName: true,
            quantity: true,
            price: true,
            total: true,
            costPrice: true,
            unitName: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    // Group by product
    const byProduct: Record<string, {
      name: string
      productId: string
      quantity: number
      total: number
      cost: number
      profit: number
      unitName: string
    }> = {}
    for (const inv of invoices) {
      for (const item of inv.items) {
        if (!byProduct[item.productId]) {
          byProduct[item.productId] = {
            name: item.productName,
            productId: item.productId,
            quantity: 0,
            total: 0,
            cost: 0,
            profit: 0,
            unitName: item.unitName || '',
          }
        }
        byProduct[item.productId].quantity += item.quantity
        byProduct[item.productId].total += item.total
        byProduct[item.productId].cost += item.costPrice * item.quantity
        byProduct[item.productId].profit += (item.price - item.costPrice) * item.quantity
      }
    }

    const productList = Object.values(byProduct).sort((a, b) => b.total - a.total)

    // Group by customer/supplier
    const byParty: Record<string, { name: string; id: string; total: number; count: number; paid: number }> = {}
    for (const inv of invoices) {
      const isSale = inv.type.includes('sale')
      const party = isSale ? inv.customer : inv.supplier
      const key = party?.id || 'unknown'
      const name = party?.name || 'بدون اسم'

      if (!byParty[key]) {
        byParty[key] = { name, id: key, total: 0, count: 0, paid: 0 }
      }
      byParty[key].total += inv.total
      byParty[key].count++
      byParty[key].paid += inv.paidAmount
    }

    const partyList = Object.values(byParty).sort((a, b) => b.total - a.total)

    // Group by date
    const byDate: Record<string, { date: string; total: number; count: number; profit: number }> = {}
    for (const inv of invoices) {
      const dateKey = new Date(inv.date).toISOString().split('T')[0]
      if (!byDate[dateKey]) {
        byDate[dateKey] = { date: dateKey, total: 0, count: 0, profit: 0 }
      }
      byDate[dateKey].total += inv.total
      byDate[dateKey].count++
      for (const item of inv.items) {
        byDate[dateKey].profit += (item.price - item.costPrice) * item.quantity
      }
    }

    const dateList = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))

    const totalProfit = productList.reduce((sum, p) => sum + p.profit, 0)
    const totalCost = productList.reduce((sum, p) => sum + p.cost, 0)

    return NextResponse.json({
      summary: {
        totalAmount: summary._sum.total || 0,
        subtotal: summary._sum.subtotal || 0,
        totalDiscount: summary._sum.discount || 0,
        totalTax: summary._sum.tax || 0,
        totalPaid: summary._sum.paidAmount || 0,
        remainingBalance: (summary._sum.total || 0) - (summary._sum.paidAmount || 0),
        invoiceCount: summary._count,
        totalProfit,
        totalCost,
        avgInvoiceTotal: summary._count > 0 ? (summary._sum.total || 0) / summary._count : 0,
      },
      invoices,
      byProduct: productList,
      byParty: partyList,
      byDate: dateList,
      groupBy,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في جلب التقرير' }, { status: 500 })
  }
}
