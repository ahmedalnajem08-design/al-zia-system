'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileBarChart,
  FileSpreadsheet,
  Calendar,
  Filter,
  Printer,
  DollarSign,
  TrendingUp,
  FileText,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ReportSummary {
  totalAmount: number
  subtotal: number
  totalDiscount: number
  totalTax: number
  totalPaid: number
  remainingBalance: number
  invoiceCount: number
  totalProfit: number
  totalCost: number
  avgInvoiceTotal: number
}

interface ReportInvoice {
  id: string
  type: string
  invoiceNo: string
  date: string
  subtotal: number
  discount: number
  tax: number
  total: number
  paidAmount: number
  notes?: string
  status: string
  customer?: { id: string; name: string } | null
  supplier?: { id: string; name: string } | null
  warehouse?: { name: string } | null
  items: {
    productId: string
    productName: string
    quantity: number
    price: number
    total: number
    costPrice: number
    unitName?: string
  }[]
}

interface ReportData {
  summary: ReportSummary
  invoices: ReportInvoice[]
  byProduct: {
    name: string
    productId: string
    quantity: number
    total: number
    cost: number
    profit: number
    unitName: string
  }[]
  byParty: {
    name: string
    id: string
    total: number
    count: number
    paid: number
  }[]
  byDate: {
    date: string
    total: number
    count: number
    profit: number
  }[]
  groupBy: string
}

type GroupByType = 'date' | 'product' | 'account'

/* ------------------------------------------------------------------ */
/*  Format helpers                                                    */
/* ------------------------------------------------------------------ */
function formatNumber(value: number): string {
  return value.toLocaleString('ar-IQ')
}

function formatCurrency(value: number): string {
  return formatNumber(Math.round(value)) + ' د.ع'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getDateRangeDefault(): { from: string; to: string } {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    from: firstDay.toISOString().split('T')[0],
    to: now.toISOString().split('T')[0],
  }
}

/* ------------------------------------------------------------------ */
/*  Status labels                                                     */
/* ------------------------------------------------------------------ */
const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  confirmed: 'مؤكدة',
  cancelled: 'ملغاة',
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

/* ------------------------------------------------------------------ */
/*  Group by labels                                                   */
/* ------------------------------------------------------------------ */
const groupByLabels: Record<string, string> = {
  date: 'التاريخ',
  product: 'المادة',
  account: 'الحساب',
}

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                  */
/* ------------------------------------------------------------------ */
function ReportSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-7 w-24 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Report table skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Invoices table skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Summary Card                                                      */
/* ------------------------------------------------------------------ */
interface SummaryCardProps {
  title: string
  value: string
  icon: React.ElementType
  colorClass: string
  bgIconClass: string
  trend?: 'up' | 'down' | null
}

function SummaryCard({ title, value, icon: Icon, colorClass, bgIconClass, trend }: SummaryCardProps) {
  return (
    <Card className="relative overflow-hidden bg-white rounded-xl shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${bgIconClass}`}>
            <Icon size={22} className={colorClass} />
          </div>
          {trend && (
            trend === 'up'
              ? <TrendingUp size={16} className="text-emerald-500" />
              : <TrendingUp size={16} className="text-red-500 rotate-180" />
          )}
        </div>
        <p className={`text-2xl font-bold mb-1 tracking-tight ${colorClass}`}>
          {value}
        </p>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
      </CardContent>

      {/* Decorative gradient corner */}
      <div className="absolute top-0 left-0 w-20 h-20 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-[0.07] bg-emerald-500" />
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */
export default function SalesReport() {
  const { setCurrentPage, setSelectedInvoiceId } = useAppStore()

  const defaultDates = getDateRangeDefault()
  const [dateFrom, setDateFrom] = useState(defaultDates.from)
  const [dateTo, setDateTo] = useState(defaultDates.to)
  const [groupBy, setGroupBy] = useState<GroupByType>('date')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: 'sales',
        dateFrom,
        dateTo,
        groupBy,
      })
      const res = await fetch(`/api/reports?${params}`)
      if (!res.ok) throw new Error('فشل في جلب التقرير')
      const data = await res.json()
      setReportData(data)
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تحميل التقرير')
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, groupBy])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handlePrint = () => {
    window.print()
  }

  const handleInvoiceClick = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId)
    setCurrentPage('invoice_detail')
  }

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/*  Page Title                                                   */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center">
            <FileBarChart size={22} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">كشف المبيعات</h1>
            <p className="text-sm text-gray-400">تقرير تفصيلي للمبيعات</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Filter Bar                                                   */}
      {/* ============================================================ */}
      <Card className="bg-white rounded-xl shadow-sm border-0 overflow-hidden print:hidden">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            {/* Date From */}
            <div className="flex-1 min-w-0">
              <Label className="text-sm font-medium text-gray-600 mb-1.5 block">
                <Calendar size={14} className="inline-block ml-1 -mt-0.5" />
                من تاريخ
              </Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            {/* Date To */}
            <div className="flex-1 min-w-0">
              <Label className="text-sm font-medium text-gray-600 mb-1.5 block">
                <Calendar size={14} className="inline-block ml-1 -mt-0.5" />
                إلى تاريخ
              </Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            {/* Group By */}
            <div className="flex-1 min-w-0">
              <Label className="text-sm font-medium text-gray-600 mb-1.5 block">
                <Filter size={14} className="inline-block ml-1 -mt-0.5" />
                تجميع حسب
              </Label>
              <Select
                value={groupBy}
                onValueChange={(val) => setGroupBy(val as GroupByType)}
              >
                <SelectTrigger className="h-10 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">التاريخ</SelectItem>
                  <SelectItem value="product">المادة</SelectItem>
                  <SelectItem value="account">الحساب</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={fetchReport}
                disabled={loading}
                className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-lg text-sm font-semibold shadow-sm px-5"
              >
                <FileSpreadsheet size={16} />
                عرض التقرير
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                className="h-10 gap-2 rounded-lg text-sm border-gray-200 hover:bg-gray-50 px-4"
              >
                <Printer size={16} />
                طباعة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/*  Loading State                                                */}
      {/* ============================================================ */}
      {loading && !reportData && <ReportSkeleton />}

      {/* ============================================================ */}
      {/*  Report Content                                               */}
      {/* ============================================================ */}
      {reportData && (
        <>
          {/* ---------------------------------------------------------- */}
          {/*  Summary Cards Row                                          */}
          {/* ---------------------------------------------------------- */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Amount */}
            <SummaryCard
              title="إجمالي المبلغ"
              value={formatCurrency(reportData.summary.totalAmount)}
              icon={DollarSign}
              colorClass="text-emerald-600"
              bgIconClass="bg-emerald-50"
              trend="up"
            />

            {/* Invoice Count */}
            <SummaryCard
              title="عدد الفواتير"
              value={formatNumber(reportData.summary.invoiceCount)}
              icon={FileText}
              colorClass="text-teal-600"
              bgIconClass="bg-teal-50"
            />

            {/* Net Profit (Sales only) */}
            <SummaryCard
              title="صافي الربح"
              value={formatCurrency(reportData.summary.totalProfit)}
              icon={TrendingUp}
              colorClass="text-amber-600"
              bgIconClass="bg-amber-50"
              trend={reportData.summary.totalProfit >= 0 ? 'up' : 'down'}
            />

            {/* Average Invoice Value */}
            <SummaryCard
              title="متوسط قيمة الفاتورة"
              value={formatCurrency(reportData.summary.avgInvoiceTotal)}
              icon={FileSpreadsheet}
              colorClass="text-purple-600"
              bgIconClass="bg-purple-50"
            />
          </div>

          {/* ---------------------------------------------------------- */}
          {/*  Grouped Report Table                                       */}
          {/* ---------------------------------------------------------- */}
          <Card className="bg-white rounded-xl shadow-sm border-0 overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                <FileBarChart size={18} className="text-emerald-600" />
                تقرير {groupByLabels[groupBy]}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      {groupBy === 'date' && (
                        <>
                          <TableHead className="text-right text-gray-600 font-semibold text-xs py-3 px-4">التاريخ</TableHead>
                          <TableHead className="text-center text-gray-600 font-semibold text-xs py-3 px-4">عدد الفواتير</TableHead>
                          <TableHead className="text-right text-gray-600 font-semibold text-xs py-3 px-4">المبلغ الإجمالي</TableHead>
                        </>
                      )}
                      {groupBy === 'product' && (
                        <>
                          <TableHead className="text-right text-gray-600 font-semibold text-xs py-3 px-4">المادة</TableHead>
                          <TableHead className="text-center text-gray-600 font-semibold text-xs py-3 px-4">الكمية</TableHead>
                          <TableHead className="text-right text-gray-600 font-semibold text-xs py-3 px-4">المبلغ الإجمالي</TableHead>
                        </>
                      )}
                      {groupBy === 'account' && (
                        <>
                          <TableHead className="text-right text-gray-600 font-semibold text-xs py-3 px-4">اسم الحساب</TableHead>
                          <TableHead className="text-center text-gray-600 font-semibold text-xs py-3 px-4">عدد الفواتير</TableHead>
                          <TableHead className="text-right text-gray-600 font-semibold text-xs py-3 px-4">المبلغ الإجمالي</TableHead>
                        </>
                      )}
                      <TableHead className="text-center text-gray-600 font-semibold text-xs py-3 px-4 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* By Date */}
                    {groupBy === 'date' && reportData.byDate.map((row) => {
                      const isExpanded = expandedRows.has(`date-${row.date}`)
                      const relatedInvoices = reportData.invoices.filter(
                        (inv) => new Date(inv.date).toISOString().split('T')[0] === row.date
                      )

                      return (
                        <Fragment key={`date-${row.date}`}>
                          <TableRow
                            className="cursor-pointer border-gray-50 hover:bg-emerald-50/40 transition-colors"
                            onClick={() => toggleRow(`date-${row.date}`)}
                          >
                            <TableCell className="py-3 px-4">
                              <span className="text-sm font-medium text-gray-700">{formatDate(row.date)}</span>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              <Badge variant="outline" className="text-xs font-medium border-emerald-200 text-emerald-700 bg-emerald-50">
                                {formatNumber(row.count)}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <span className="text-sm font-bold text-gray-800">{formatCurrency(row.total)}</span>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              {isExpanded
                                ? <ChevronUp size={16} className="text-gray-400" />
                                : <ChevronDown size={16} className="text-gray-400" />
                              }
                            </TableCell>
                          </TableRow>

                          {/* Expanded details */}
                          {isExpanded && relatedInvoices.map((inv) => (
                            <TableRow key={`inv-${inv.id}`} className="bg-emerald-50/20 border-gray-50">
                              <TableCell className="py-2 px-4 pr-8">
                                <span className="text-xs font-mono text-gray-500">{inv.invoiceNo}</span>
                              </TableCell>
                              <TableCell className="py-2 px-4 text-center">
                                <span className="text-xs text-gray-500">{inv.customer?.name || '—'}</span>
                              </TableCell>
                              <TableCell className="py-2 px-4">
                                <span className="text-xs font-medium text-gray-700">{formatCurrency(inv.total)}</span>
                              </TableCell>
                              <TableCell className="py-2 px-4 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleInvoiceClick(inv.id)
                                  }}
                                >
                                  <Eye size={14} />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </Fragment>
                      )
                    })}

                    {/* By Product */}
                    {groupBy === 'product' && reportData.byProduct.map((row) => {
                      const isExpanded = expandedRows.has(`product-${row.productId}`)
                      const relatedInvoices = reportData.invoices.filter(
                        (inv) => inv.items.some((item) => item.productId === row.productId)
                      )

                      return (
                        <Fragment key={`product-${row.productId}`}>
                          <TableRow
                            className="cursor-pointer border-gray-50 hover:bg-emerald-50/40 transition-colors"
                            onClick={() => toggleRow(`product-${row.productId}`)}
                          >
                            <TableCell className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                  <FileSpreadsheet size={14} className="text-emerald-600" />
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-700 block">{row.name}</span>
                                  {row.unitName && (
                                    <span className="text-xs text-gray-400">{row.unitName}</span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              <Badge variant="outline" className="text-xs font-medium border-emerald-200 text-emerald-700 bg-emerald-50">
                                {formatNumber(row.quantity)}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <span className="text-sm font-bold text-gray-800">{formatCurrency(row.total)}</span>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              {isExpanded
                                ? <ChevronUp size={16} className="text-gray-400" />
                                : <ChevronDown size={16} className="text-gray-400" />
                              }
                            </TableCell>
                          </TableRow>

                          {/* Expanded details */}
                          {isExpanded && relatedInvoices.map((inv) => {
                            const item = inv.items.find((i) => i.productId === row.productId)
                            return (
                              <TableRow key={`inv-${inv.id}`} className="bg-emerald-50/20 border-gray-50">
                                <TableCell className="py-2 px-4 pr-8">
                                  <span className="text-xs font-mono text-gray-500">{inv.invoiceNo}</span>
                                </TableCell>
                                <TableCell className="py-2 px-4 text-center">
                                  <span className="text-xs text-gray-500">{item ? formatNumber(item.quantity) : '—'}</span>
                                </TableCell>
                                <TableCell className="py-2 px-4">
                                  <span className="text-xs font-medium text-gray-700">{item ? formatCurrency(item.total) : '—'}</span>
                                </TableCell>
                                <TableCell className="py-2 px-4 text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleInvoiceClick(inv.id)
                                    }}
                                  >
                                    <Eye size={14} />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </Fragment>
                      )
                    })}

                    {/* By Account */}
                    {groupBy === 'account' && reportData.byParty.map((row) => {
                      const isExpanded = expandedRows.has(`account-${row.id}`)
                      const relatedInvoices = reportData.invoices.filter(
                        (inv) => inv.customer?.id === row.id
                      )

                      return (
                        <Fragment key={`account-${row.id}`}>
                          <TableRow
                            className="cursor-pointer border-gray-50 hover:bg-emerald-50/40 transition-colors"
                            onClick={() => toggleRow(`account-${row.id}`)}
                          >
                            <TableCell className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                  <DollarSign size={14} className="text-emerald-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">{row.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              <Badge variant="outline" className="text-xs font-medium border-emerald-200 text-emerald-700 bg-emerald-50">
                                {formatNumber(row.count)}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <span className="text-sm font-bold text-gray-800">{formatCurrency(row.total)}</span>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              {isExpanded
                                ? <ChevronUp size={16} className="text-gray-400" />
                                : <ChevronDown size={16} className="text-gray-400" />
                              }
                            </TableCell>
                          </TableRow>

                          {/* Expanded details */}
                          {isExpanded && relatedInvoices.map((inv) => (
                            <TableRow key={`inv-${inv.id}`} className="bg-emerald-50/20 border-gray-50">
                              <TableCell className="py-2 px-4 pr-8">
                                <span className="text-xs font-mono text-gray-500">{inv.invoiceNo}</span>
                              </TableCell>
                              <TableCell className="py-2 px-4 text-center">
                                <span className="text-xs text-gray-500">{formatDate(inv.date)}</span>
                              </TableCell>
                              <TableCell className="py-2 px-4">
                                <span className="text-xs font-medium text-gray-700">{formatCurrency(inv.total)}</span>
                              </TableCell>
                              <TableCell className="py-2 px-4 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleInvoiceClick(inv.id)
                                  }}
                                >
                                  <Eye size={14} />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </Fragment>
                      )
                    })}

                    {/* Empty state */}
                    {((groupBy === 'date' && reportData.byDate.length === 0) ||
                      (groupBy === 'product' && reportData.byProduct.length === 0) ||
                      (groupBy === 'account' && reportData.byParty.length === 0)) && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-16 text-center"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                              <FileBarChart size={24} className="text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">لا توجد بيانات</p>
                            <p className="text-xs text-gray-400 mt-1">لا توجد نتائج للفترة المحددة</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* ---------------------------------------------------------- */}
          {/*  Detailed Invoices Table                                    */}
          {/* ---------------------------------------------------------- */}
          <Card className="bg-white rounded-xl shadow-sm border-0 overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-emerald-600" />
                تفاصيل الفواتير
                <Badge variant="outline" className="text-xs font-medium border-emerald-200 text-emerald-700 bg-emerald-50 mr-2">
                  {formatNumber(reportData.invoices.length)} فاتورة
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {reportData.invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <FileText size={24} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">لا توجد فواتير</p>
                  <p className="text-xs text-gray-400 mt-1">لا توجد فواتير مؤكدة في الفترة المحددة</p>
                </div>
              ) : (
                <div className="max-h-[460px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                        <TableHead className="text-right text-gray-600 font-semibold text-xs py-3 px-4">رقم الفاتورة</TableHead>
                        <TableHead className="text-right text-gray-600 font-semibold text-xs py-3 px-4">التاريخ</TableHead>
                        <TableHead className="text-right text-gray-600 font-semibold text-xs py-3 px-4">الحساب</TableHead>
                        <TableHead className="text-right text-gray-600 font-semibold text-xs py-3 px-4">المبلغ</TableHead>
                        <TableHead className="text-center text-gray-600 font-semibold text-xs py-3 px-4">الحالة</TableHead>
                        <TableHead className="text-right text-gray-600 font-semibold text-xs py-3 px-4">المخزن</TableHead>
                        <TableHead className="text-center text-gray-600 font-semibold text-xs py-3 px-4 w-10">إجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.invoices.map((invoice) => (
                        <TableRow
                          key={invoice.id}
                          className="cursor-pointer border-gray-50 hover:bg-emerald-50/40 transition-colors group"
                          onClick={() => handleInvoiceClick(invoice.id)}
                        >
                          <TableCell className="py-3 px-4">
                            <span className="font-mono text-sm font-semibold text-gray-700">{invoice.invoiceNo}</span>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <span className="text-xs text-gray-500">{formatDate(invoice.date)}</span>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <span className="text-sm text-gray-700 font-medium">{invoice.customer?.name || '—'}</span>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <span className="text-sm font-bold text-gray-800">{formatCurrency(invoice.total)}</span>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-center">
                            <Badge
                              variant="outline"
                              className={`text-xs font-medium ${statusColors[invoice.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
                            >
                              {statusLabels[invoice.status] || invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <span className="text-xs text-gray-500">{invoice.warehouse?.name || '—'}</span>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleInvoiceClick(invoice.id)
                              }}
                            >
                              <Eye size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
