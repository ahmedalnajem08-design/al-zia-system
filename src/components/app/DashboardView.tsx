'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  Users,
  Building2,
  ShoppingCart,
  Truck,
  Plus,
  Eye,
  TrendingUp,
  TrendingDown,
  ArrowUpLeft,
} from 'lucide-react'
import type { DashboardStats, InvoiceType, InvoiceStatus } from '@/lib/types'

/* ------------------------------------------------------------------ */
/*  Type label mapping                                                */
/* ------------------------------------------------------------------ */
const typeLabels: Record<InvoiceType, string> = {
  sale: 'بيع',
  purchase: 'شراء',
  sale_return: 'إرجاع بيع',
  purchase_return: 'إرجاع شراء',
}

const typeColors: Record<InvoiceType, string> = {
  sale: 'bg-emerald-100 text-emerald-700',
  purchase: 'bg-blue-100 text-blue-700',
  sale_return: 'bg-orange-100 text-orange-700',
  purchase_return: 'bg-rose-100 text-rose-700',
}

const statusLabels: Record<InvoiceStatus, string> = {
  draft: 'مسودة',
  confirmed: 'مؤكدة',
  cancelled: 'ملغاة',
}

const statusVariant: Record<InvoiceStatus, 'secondary' | 'default' | 'destructive'> = {
  draft: 'secondary',
  confirmed: 'default',
  cancelled: 'destructive',
}

/* ------------------------------------------------------------------ */
/*  Stats card configuration                                          */
/* ------------------------------------------------------------------ */
interface StatCardConfig {
  key: keyof DashboardStats
  label: string
  icon: React.ElementType
  colorClass: string
  bgIconClass: string
  format: 'currency' | 'number'
}

const statCards: StatCardConfig[] = [
  {
    key: 'totalSalesToday',
    label: 'مبيعات اليوم',
    icon: DollarSign,
    colorClass: 'text-emerald-600',
    bgIconClass: 'bg-emerald-50',
    format: 'currency',
  },
  {
    key: 'totalPurchasesToday',
    label: 'مشتريات اليوم',
    icon: ShoppingBag,
    colorClass: 'text-blue-600',
    bgIconClass: 'bg-blue-50',
    format: 'currency',
  },
  {
    key: 'totalProducts',
    label: 'عدد المواد',
    icon: Package,
    colorClass: 'text-amber-600',
    bgIconClass: 'bg-amber-50',
    format: 'number',
  },
  {
    key: 'lowStockCount',
    label: 'مخزون منخفض',
    icon: AlertTriangle,
    colorClass: 'text-red-600',
    bgIconClass: 'bg-red-50',
    format: 'number',
  },
  {
    key: 'totalCustomers',
    label: 'الزبائن',
    icon: Users,
    colorClass: 'text-purple-600',
    bgIconClass: 'bg-purple-50',
    format: 'number',
  },
  {
    key: 'totalSuppliers',
    label: 'المجهزون',
    icon: Building2,
    colorClass: 'text-teal-600',
    bgIconClass: 'bg-teal-50',
    format: 'number',
  },
]

/* ------------------------------------------------------------------ */
/*  Format helpers                                                    */
/* ------------------------------------------------------------------ */
function formatNumber(value: number): string {
  return value.toLocaleString('ar-SA')
}

function formatCurrency(value: number): string {
  return formatNumber(value) + ' ر.س'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                  */
/* ------------------------------------------------------------------ */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Stats Card Component                                              */
/* ------------------------------------------------------------------ */
function StatCard({ config, value }: { config: StatCardConfig; value: number }) {
  const Icon = config.icon
  const formattedValue =
    config.format === 'currency' ? formatCurrency(value) : formatNumber(value)

  const isCurrency = config.format === 'currency'
  const isAlert = config.key === 'lowStockCount' && value > 0

  return (
    <Card
      className={`relative overflow-hidden bg-white rounded-xl shadow-sm border-0 hover:shadow-md transition-shadow duration-200 ${isAlert ? 'ring-2 ring-red-200' : ''}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div
            className={`h-11 w-11 rounded-xl flex items-center justify-center ${config.bgIconClass}`}
          >
            <Icon size={22} className={config.colorClass} />
          </div>
          {isCurrency && config.key === 'totalSalesToday' && (
            <TrendingUp size={16} className="text-emerald-500" />
          )}
          {isCurrency && config.key === 'totalPurchasesToday' && (
            <TrendingDown size={16} className="text-blue-500" />
          )}
          {isAlert && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          )}
        </div>
        <p
          className={`text-2xl font-bold mb-1 tracking-tight ${config.colorClass}`}
        >
          {formattedValue}
        </p>
        <p className="text-sm text-gray-500 font-medium">{config.label}</p>
      </CardContent>

      {/* Decorative gradient corner */}
      <div
        className={`absolute top-0 left-0 w-20 h-20 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-[0.07] ${
          config.key === 'totalSalesToday'
            ? 'bg-emerald-500'
            : config.key === 'totalPurchasesToday'
              ? 'bg-blue-500'
              : config.key === 'totalProducts'
                ? 'bg-amber-500'
                : config.key === 'lowStockCount'
                  ? 'bg-red-500'
                  : config.key === 'totalCustomers'
                    ? 'bg-purple-500'
                    : 'bg-teal-500'
        }`}
      />
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Main DashboardView Component                                      */
/* ------------------------------------------------------------------ */
export default function DashboardView() {
  const { setCurrentPage, setSelectedInvoiceId } = useAppStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch('/api/dashboard')
        if (!res.ok) throw new Error('فشل في جلب البيانات')
        const data = await res.json()
        setStats(data)
      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء تحميل البيانات')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const handleInvoiceClick = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId)
    setCurrentPage('invoice_detail')
  }

  /* ---- Loading state ---- */
  if (loading) {
    return <DashboardSkeleton />
  }

  /* ---- Error state ---- */
  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">خطأ في تحميل البيانات</h3>
        <p className="text-sm text-gray-500 mb-4">{error || 'لم يتم العثور على بيانات'}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="gap-2"
        >
          <ArrowUpLeft size={16} />
          إعادة المحاولة
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/*  Stats Cards Row                                              */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((config) => (
          <StatCard
            key={config.key}
            config={config}
            value={stats[config.key] as number}
          />
        ))}
      </div>

      {/* ============================================================ */}
      {/*  Recent Invoices Table                                        */}
      {/* ============================================================ */}
      <Card className="bg-white rounded-xl shadow-sm border-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">أحدث الفواتير</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              آخر {stats.recentInvoices.length} فواتير مسجلة
            </p>
          </div>
        </div>

        {stats.recentInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <ShoppingBag size={24} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">لا توجد فواتير بعد</p>
            <p className="text-xs text-gray-400 mt-1">ابدأ بإنشاء فاتورة بيع أو شراء جديدة</p>
          </div>
        ) : (
          <div className="max-h-[460px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="text-right text-gray-600 font-semibold text-xs py-3 px-4">
                    رقم الفاتورة
                  </TableHead>
                  <TableHead className="text-right text-gray-600 font-semibold text-xs py-3 px-4">
                    النوع
                  </TableHead>
                  <TableHead className="text-right text-gray-600 font-semibold text-xs py-3 px-4">
                    الزبون/المجهز
                  </TableHead>
                  <TableHead className="text-right text-gray-600 font-semibold text-xs py-3 px-4">
                    المبلغ
                  </TableHead>
                  <TableHead className="text-right text-gray-600 font-semibold text-xs py-3 px-4">
                    الحالة
                  </TableHead>
                  <TableHead className="text-right text-gray-600 font-semibold text-xs py-3 px-4">
                    التاريخ
                  </TableHead>
                  <TableHead className="text-center text-gray-600 font-semibold text-xs py-3 px-4">
                    إجراء
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentInvoices.map((invoice) => {
                  const partyName =
                    invoice.type === 'sale' || invoice.type === 'sale_return'
                      ? invoice.customer?.name
                      : invoice.supplier?.name

                  return (
                    <TableRow
                      key={invoice.id}
                      className="cursor-pointer border-gray-50 hover:bg-emerald-50/40 transition-colors group"
                      onClick={() => handleInvoiceClick(invoice.id)}
                    >
                      <TableCell className="py-3 px-4">
                        <span className="font-mono text-sm font-semibold text-gray-700">
                          {invoice.invoiceNo}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            typeColors[invoice.type as InvoiceType]
                          }`}
                        >
                          {typeLabels[invoice.type as InvoiceType]}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <span className="text-sm text-gray-700 font-medium">
                          {partyName || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <span className="text-sm font-bold text-gray-800">
                          {formatCurrency(invoice.total)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge
                          variant={statusVariant[invoice.status as InvoiceStatus]}
                          className="text-xs font-medium"
                        >
                          {statusLabels[invoice.status as InvoiceStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <span className="text-xs text-gray-500">
                          {formatDate(invoice.createdAt)}
                        </span>
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
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* ============================================================ */}
      {/*  Quick Actions Row                                            */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button
          onClick={() => setCurrentPage('sale')}
          className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-3 text-sm font-semibold shadow-sm hover:shadow-md transition-all"
        >
          <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
            <ShoppingCart size={18} />
          </div>
          فاتورة بيع جديدة
        </Button>

        <Button
          onClick={() => setCurrentPage('purchase')}
          variant="outline"
          className="h-12 border-blue-200 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-300 text-blue-700 rounded-xl gap-3 text-sm font-semibold shadow-sm hover:shadow-md transition-all"
        >
          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Truck size={18} />
          </div>
          فاتورة شراء جديدة
        </Button>

        <Button
          onClick={() => setCurrentPage('products')}
          variant="outline"
          className="h-12 border-amber-200 bg-amber-50/50 hover:bg-amber-100 hover:border-amber-300 text-amber-700 rounded-xl gap-3 text-sm font-semibold shadow-sm hover:shadow-md transition-all"
        >
          <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <Plus size={18} />
          </div>
          إضافة مادة
        </Button>
      </div>
    </div>
  )
}
