import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/reconciliation?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Use wider range to cover timezone differences (UTC vs local Asia/Baghdad UTC+3)
    // Data is stored in UTC, but user selects calendar date in local time
    const rangeStart = new Date(dateStr + 'T00:00:00Z')
    const rangeEnd = new Date(dateStr + 'T00:00:00Z')
    rangeStart.setHours(rangeStart.getHours() - 12)
    rangeEnd.setHours(rangeEnd.getHours() + 36)

    const salesInvoices = await db.invoice.findMany({
      where: {
        type: { in: ['sale'] },
        status: 'confirmed',
        date: { gte: rangeStart, lte: rangeEnd },
      },
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const purchaseInvoices = await db.invoice.findMany({
      where: {
        type: { in: ['purchase'] },
        status: 'confirmed',
        date: { gte: rangeStart, lte: rangeEnd },
      },
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const vouchers = await db.voucher.findMany({
      where: { date: { gte: rangeStart, lte: rangeEnd } },
      include: {
        customer: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const expenses = await db.expense.findMany({
      where: { date: { gte: rangeStart, lte: rangeEnd } },
      orderBy: { createdAt: 'desc' },
    })

    // Filter records by matching the calendar day (ignore timezone offset)
    // Compare the date portion of the ISO string
    const matchDate = (record: any, dateField: string) => {
      const d = record[dateField] instanceof Date ? record[dateField] : new Date(record[dateField])
      return d.toISOString().slice(0, 10) === dateStr
    }

    const filteredSales = salesInvoices.filter(inv => matchDate(inv, 'date'))
    const filteredPurchases = purchaseInvoices.filter(inv => matchDate(inv, 'date'))
    const filteredVouchers = vouchers.filter(v => matchDate(v, 'date'))
    const filteredExpenses = expenses.filter(e => matchDate(e, 'date'))

    // Calculate totals
    const cashSales = filteredSales.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0)
    const creditSales = filteredSales.reduce((sum, inv) => sum + ((inv.total || 0) - (inv.paidAmount || 0)), 0)
    const totalSales = filteredSales.reduce((sum, inv) => sum + (inv.total || 0), 0)
    const totalPurchases = filteredPurchases.reduce((sum, inv) => sum + (inv.total || 0), 0)
    const totalPurchasePaid = filteredPurchases.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0)

    const receiptVouchers = filteredVouchers
      .filter(v => v.type === 'receipt')
      .reduce((sum, v) => sum + (v.amount || 0), 0)
    const paymentVouchers = filteredVouchers
      .filter(v => v.type === 'payment')
      .reduce((sum, v) => sum + (v.amount || 0), 0)
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)

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
      salesInvoices: filteredSales,
      purchaseInvoices: filteredPurchases,
      vouchers: filteredVouchers,
      expenses: filteredExpenses,
    })
  } catch (error: any) {
    console.error('Reconciliation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
