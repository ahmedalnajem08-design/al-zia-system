import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Total sales today (confirmed sale invoices)
    const salesToday = await db.invoice.aggregate({
      where: {
        type: 'sale',
        status: 'confirmed',
        date: { gte: today, lt: tomorrow },
      },
      _sum: { total: true },
    })

    // Total purchases today (confirmed purchase invoices)
    const purchasesToday = await db.invoice.aggregate({
      where: {
        type: 'purchase',
        status: 'confirmed',
        date: { gte: today, lt: tomorrow },
      },
      _sum: { total: true },
    })

    // Total products count
    const totalProducts = await db.product.count({ where: { isActive: true } })

    // Low stock count: items where quantity <= minStock
    const lowStockCount = await db.warehouseStock.count({
      where: {
        quantity: { lte: db.warehouseStock.fields.minStock },
      },
    })

    // Total customers
    const totalCustomers = await db.customer.count({ where: { isActive: true } })

    // Total suppliers
    const totalSuppliers = await db.supplier.count({ where: { isActive: true } })

    // Recent 10 invoices
    const recentInvoices = await db.invoice.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true } },
        supplier: { select: { name: true } },
        warehouse: { select: { name: true } },
        items: { select: { productName: true, quantity: true, total: true } },
      },
    })

    // Top 5 products by quantity sold
    const topProducts = await db.invoiceItem.groupBy({
      by: ['productId', 'productName'],
      where: { invoice: { type: { in: ['sale', 'sale_return'] }, status: 'confirmed' } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    })

    return NextResponse.json({
      totalSalesToday: salesToday._sum.total || 0,
      totalPurchasesToday: purchasesToday._sum.total || 0,
      totalProducts,
      lowStockCount,
      totalCustomers,
      totalSuppliers,
      recentInvoices,
      topProducts,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في جلب البيانات' }, { status: 500 })
  }
}
