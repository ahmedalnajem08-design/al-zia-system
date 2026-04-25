import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/expenses - List expenses with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (category) where.category = category
    if (fromDate || toDate) {
      where.date = {}
      if (fromDate) where.date.gte = new Date(fromDate)
      if (toDate) where.date.lte = new Date(toDate + 'T23:59:59')
    }

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.expense.count({ where }),
    ])

    // Category summary
    const categorySummary = await db.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where,
    })

    return NextResponse.json({ expenses, total, page, limit, categorySummary })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/expenses - Create a new expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, category, description, date, notes } = body

    if (!amount || amount <= 0 || !description) {
      return NextResponse.json({ error: 'بيانات سند الصرف غير مكتملة' }, { status: 400 })
    }

    // Generate expense number
    const count = await db.expense.count()
    const expenseNo = `EXP-${String(count + 1).padStart(4, '0')}`

    const expense = await db.expense.create({
      data: {
        expenseNo,
        amount,
        category: category || 'أخرى',
        description,
        date: date ? new Date(date) : new Date(),
        notes: notes || null,
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
