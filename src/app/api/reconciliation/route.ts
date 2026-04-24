import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/reconciliation?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const startOfDay = new Date(dateStr + 'T00:00:00')
    const endOfDay = new Date(dateStr + 'T23:59:59')

    // Get confirmed sales invoices for the day
    const salesInvoices = await db.invoice.findMany({
      where: {
        type: { in: ['sale'] },
        status: 'confirmed',
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        customer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get confirmed purchase invoices for the day
    const purchaseInvoices = await db.invoice.findMany({
      where: {
        type: { in: ['purchase'] },
        status: 'confirmed',
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get vouchers for the day
    const vouchers = await db.voucher.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        customer: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get expenses for the day
    const expenses = await db.expense.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate totals
    const cashSales = salesInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0)
    const creditSales = salesInvoices.reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0)
    const totalSales = salesInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const totalPurchases = purchaseInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const totalPurchasePaid = purchaseInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0)

    const receiptVouchers = vouchers.filter(v => v.type === 'receipt').reduce((sum, v) => sum + v.amount, 0)
    const paymentVouchers = vouchers.filter(v => v.type === 'payment').reduce((sum, v) => sum + v.amount, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

    // Net cash = cash sales + receipt vouchers - payment vouchers - expenses
    const netCash = cashSales + receiptVouchers - paymentVouchers - totalExpenses

    return NextResponse.json({
      date: dateStr,
      cashSales,
      creditSales,
      totalSales,
      totalPurchases,
      totalPurchasePaid,
      receiptVouchers,
      paymentVouchers,
      totalExpenses,
      netCash,
      salesInvoices,
      purchaseInvoices,
      vouchers,
      expenses,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
