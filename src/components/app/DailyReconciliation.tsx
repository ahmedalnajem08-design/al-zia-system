'use client'

import { useState, useEffect, useCallback, startTransition } from 'react'
import { useAppStore } from '@/lib/store'
import { ArrowRight, Calculator, Loader2, ShoppingCart, ArrowDownLeft, ArrowUpRight, Receipt, Wallet } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '٠'
  return num.toLocaleString('ar-IQ')
}

const methodLabels: Record<string, string> = {
  cash: 'نقدي',
  card: 'بطاقة',
  transfer: 'تحويل',
  cheque: 'شيك',
}

const categoryColors: Record<string, string> = {
  'إيجار': 'bg-blue-100 text-blue-700',
  'مرافق': 'bg-yellow-100 text-yellow-700',
  'رواتب': 'bg-purple-100 text-purple-700',
  'صيانة': 'bg-orange-100 text-orange-700',
  'نقل': 'bg-teal-100 text-teal-700',
  'أخرى': 'bg-gray-100 text-gray-700',
}

interface ReconciliationData {
  date: string
  cashSales: number
  creditSales: number
  totalSales: number
  totalPurchases: number
  totalPurchasePaid: number
  receiptVouchers: number
  paymentVouchers: number
  totalExpenses: number
  netCash: number
  salesInvoices: any[]
  purchaseInvoices: any[]
  vouchers: any[]
  expenses: any[]
}

export default function DailyReconciliation() {
  const { setCurrentPage } = useAppStore()
  // Use local date (Asia/Baghdad) instead of UTC
  const [date, setDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  const [data, setData] = useState<ReconciliationData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reconciliation?date=${date}`)
      if (!res.ok) {
        setData(null)
        return
      }
      const result = await res.json()
      if (result.error) {
        setData(null)
        return
      }
      setData(result)
    } catch {
      setData(null)
    }
    setLoading(false)
  }, [date])

  useEffect(() => {
    startTransition(() => {
      fetchData()
    })
  }, [fetchData])

  const receiptVoucherList = data?.vouchers?.filter((v: any) => v.type === 'receipt') || []
  const paymentVoucherList = data?.vouchers?.filter((v: any) => v.type === 'payment') || []

  const hasData = data && (
    data.salesInvoices.length > 0 || data.vouchers.length > 0 || data.expenses.length > 0
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    )
  }

  // Default empty data
  const d = data || {
    cashSales: 0, creditSales: 0, totalSales: 0, totalPurchases: 0,
    totalPurchasePaid: 0, receiptVouchers: 0, paymentVouchers: 0,
    totalExpenses: 0, netCash: 0,
    salesInvoices: [], purchaseInvoices: [], vouchers: [], expenses: [],
  }

  const statsCards = [
    { title: 'المبيعات النقدية', value: d.cashSales, icon: ShoppingCart, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { title: 'المبيعات الآجلة', value: d.creditSales, icon: ShoppingCart, color: 'text-blue-700', bg: 'bg-blue-50' },
    { title: 'سندات القبض', value: d.receiptVouchers, icon: ArrowDownLeft, color: 'text-teal-700', bg: 'bg-teal-50' },
    { title: 'سندات الدفع', value: d.paymentVouchers, icon: ArrowUpRight, color: 'text-amber-700', bg: 'bg-amber-50' },
    { title: 'المصروفات', value: d.totalExpenses, icon: Receipt, color: 'text-red-700', bg: 'bg-red-50' },
    {
      title: 'صافي الصندوق',
      value: d.netCash,
      icon: Wallet,
      color: d.netCash >= 0 ? 'text-emerald-700' : 'text-red-700',
      bg: d.netCash >= 0 ? 'bg-emerald-50' : 'bg-red-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage('dashboard')}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowRight size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">
              <Calculator size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">المطابقة اليومية</h1>
              <p className="text-sm text-gray-500">مطابقة المبيعات والسندات والمصروفات</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">التاريخ</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 w-44"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statsCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.title} className="overflow-hidden">
              <CardContent className="p-4">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.bg} mb-2`}>
                  <Icon size={18} className={s.color} />
                </div>
                <p className={`text-lg font-bold ${s.color}`}>
                  {formatNumber(s.value)} <span className="text-xs font-normal">د.ع</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{s.title}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detail Tabs */}
      <Tabs defaultValue="sales" dir="rtl">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">المبيعات ({d.salesInvoices.length})</TabsTrigger>
          <TabsTrigger value="receipts">سندات القبض ({receiptVoucherList.length})</TabsTrigger>
          <TabsTrigger value="payments">سندات الدفع ({paymentVoucherList.length})</TabsTrigger>
          <TabsTrigger value="expenses">المصروفات ({d.expenses.length})</TabsTrigger>
        </TabsList>

        {/* Sales Tab */}
        <TabsContent value="sales">
          <Card>
            <CardContent className="p-0">
              {d.salesInvoices.length === 0 ? (
                <p className="text-gray-400 text-center py-12">لا توجد مبيعات في هذا اليوم</p>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                        <TableHead>رقم الفاتورة</TableHead>
                        <TableHead>الزبون</TableHead>
                        <TableHead>الإجمالي</TableHead>
                        <TableHead>المدفوع</TableHead>
                        <TableHead>المتبقي</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.salesInvoices.map((inv: any) => {
                        const remaining = inv.total - inv.paidAmount
                        return (
                          <TableRow key={inv.id}>
                            <TableCell className="font-mono text-sm">{inv.invoiceNo}</TableCell>
                            <TableCell className="font-medium">{inv.customer?.name || '—'}</TableCell>
                            <TableCell className="font-semibold">{formatNumber(inv.total)} د.ع</TableCell>
                            <TableCell className="text-emerald-700">{formatNumber(inv.paidAmount)} د.ع</TableCell>
                            <TableCell className={remaining > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                              {formatNumber(remaining)} د.ع
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={remaining <= 0 ? 'default' : 'secondary'}
                                className={remaining <= 0 ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                              >
                                {remaining <= 0 ? 'مدفوعة' : 'آجلة'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts">
          <Card>
            <CardContent className="p-0">
              {receiptVoucherList.length === 0 ? (
                <p className="text-gray-400 text-center py-12">لا توجد سندات قبض في هذا اليوم</p>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                        <TableHead>رقم السند</TableHead>
                        <TableHead>الزبون</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>الطريقة</TableHead>
                        <TableHead>الوصف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receiptVoucherList.map((v: any) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-mono text-sm">{v.voucherNo}</TableCell>
                          <TableCell className="font-medium">{v.customer?.name || '—'}</TableCell>
                          <TableCell className="font-bold text-emerald-700">{formatNumber(v.amount)} د.ع</TableCell>
                          <TableCell>
                            <Badge variant="outline">{methodLabels[v.method] || v.method}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{v.description || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardContent className="p-0">
              {paymentVoucherList.length === 0 ? (
                <p className="text-gray-400 text-center py-12">لا توجد سندات دفع في هذا اليوم</p>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                        <TableHead>رقم السند</TableHead>
                        <TableHead>المجهز</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>الطريقة</TableHead>
                        <TableHead>الوصف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentVoucherList.map((v: any) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-mono text-sm">{v.voucherNo}</TableCell>
                          <TableCell className="font-medium">{v.supplier?.name || '—'}</TableCell>
                          <TableCell className="font-bold text-amber-700">{formatNumber(v.amount)} د.ع</TableCell>
                          <TableCell>
                            <Badge variant="outline">{methodLabels[v.method] || v.method}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{v.description || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <Card>
            <CardContent className="p-0">
              {d.expenses.length === 0 ? (
                <p className="text-gray-400 text-center py-12">لا توجد مصروفات في هذا اليوم</p>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                        <TableHead>رقم السند</TableHead>
                        <TableHead>التصنيف</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead>المبلغ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.expenses.map((e: any) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-mono text-sm">{e.expenseNo}</TableCell>
                          <TableCell>
                            <Badge className={categoryColors[e.category] || 'bg-gray-100'}>
                              {e.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{e.description}</TableCell>
                          <TableCell className="font-bold text-red-700">{formatNumber(e.amount)} د.ع</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
