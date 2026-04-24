'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Package,
  Warehouse,
  Loader2,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StockAlert {
  id: string
  warehouseId: string
  productId: string
  quantity: number
  minStock: number
  updatedAt: string
  warehouse: { id: string; name: string } | null
  product: {
    id: string
    name: string
    sku: string | null
    barcode: string | null
    costPrice: number
    category: { name: string } | null
  } | null
  unit: { id: string; name: string; conversionFactor: number } | null
}

type AlertLevel = 'all' | 'critical' | 'warning'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatNumber(value: number): string {
  return value.toLocaleString('ar-IQ', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function getAlertLevel(item: StockAlert): 'critical' | 'warning' {
  if (item.quantity <= 0) return 'critical'
  return 'warning'
}

function getAlertBgClass(item: StockAlert): string {
  if (item.quantity <= 0) return 'bg-red-50 border-red-200'
  if (item.quantity <= item.minStock / 2) return 'bg-amber-50 border-amber-200'
  return 'bg-yellow-50 border-yellow-200'
}

function getAlertCardBgClass(item: StockAlert): string {
  if (item.quantity <= 0) return 'bg-red-500'
  if (item.quantity <= item.minStock / 2) return 'bg-amber-500'
  return 'bg-yellow-500'
}

function getProgressColor(item: StockAlert): string {
  if (item.quantity <= 0) return '[&>div]:bg-red-500'
  if (item.quantity <= item.minStock / 2) return '[&>div]:bg-amber-500'
  return '[&>div]:bg-yellow-500'
}

function getAlertBadge(level: AlertLevel): { label: string; className: string; icon: React.ElementType } {
  switch (level) {
    case 'critical':
      return {
        label: 'حرج',
        className: 'bg-red-50 text-red-700 border-red-200',
        icon: ShieldAlert,
      }
    case 'warning':
      return {
        label: 'تحذير',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: ShieldCheck,
      }
    default:
      return {
        label: 'الكل',
        className: 'bg-gray-50 text-gray-600 border-gray-200',
        icon: AlertTriangle,
      }
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StockAlertsView() {
  /* ---- State ---- */
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [alertLevel, setAlertLevel] = useState<AlertLevel>('all')

  /* ---- Fetch alerts ---- */
  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stock?lowStock=true')
      if (!res.ok) throw new Error('فشل في جلب البيانات')
      const data = await res.json()
      setAlerts(data || [])
    } catch {
      toast.error('خطأ في جلب تنبيهات المخزون')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  /* ---- Computed ---- */
  const criticalCount = alerts.filter((a) => a.quantity <= 0).length
  const warningCount = alerts.filter((a) => a.quantity > 0).length

  const filteredAlerts = alerts.filter((a) => {
    if (alertLevel === 'critical') return a.quantity <= 0
    if (alertLevel === 'warning') return a.quantity > 0
    return true
  })

  /* ---- Reorder (visual) ---- */
  function handleReorder(item: StockAlert) {
    toast.info(`تم إنشاء طلب إعادة تخزين للمادة "${item.product?.name}" (الوظيفة تجريبية)`)
  }

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="space-y-6">
      {/* ---- Title Bar ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="text-amber-600" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">تنبيهات المخزون</h2>
            <p className="text-sm text-gray-500">
              مواد على وشك النفاذ أو منتهية
            </p>
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-32 rounded-full" />
        ) : alerts.length > 0 ? (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 text-sm px-3 py-1.5 gap-1.5"
          >
            <AlertTriangle size={14} />
            {formatNumber(alerts.length)} مادة تحتاج انتباه
          </Badge>
        ) : null}
      </div>

      {/* ---- Summary Cards ---- */}
      {!loading && alerts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-white border-gray-100 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <ShieldAlert size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{formatNumber(criticalCount)}</p>
                <p className="text-xs text-gray-500">حرج (نفذت الكمية)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-100 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{formatNumber(warningCount)}</p>
                <p className="text-xs text-gray-500">تحذير (أقل من الحد)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-100 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-700">{formatNumber(alerts.length)}</p>
                <p className="text-xs text-gray-500">إجمالي التنبيهات</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ---- Filter ---- */}
      {alerts.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 font-medium">تصفية:</span>
          <div className="flex gap-2">
            {(['all', 'critical', 'warning'] as AlertLevel[]).map((level) => {
              const badge = getAlertBadge(level)
              const LevelIcon = badge.icon
              const isActive = alertLevel === level

              return (
                <Button
                  key={level}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className={`gap-1.5 text-xs h-8 rounded-lg transition-colors ${
                    isActive
                      ? level === 'critical'
                        ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                        : level === 'warning'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                        : 'bg-gray-700 hover:bg-gray-800 text-white border-gray-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setAlertLevel(level)}
                >
                  <LevelIcon size={14} />
                  {badge.label}
                  <Badge
                    variant="secondary"
                    className={`text-xs px-1.5 h-5 min-w-5 flex items-center justify-center ${
                      isActive
                        ? 'bg-white/20 text-inherit'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {level === 'all'
                      ? alerts.length
                      : level === 'critical'
                      ? criticalCount
                      : warningCount}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* ---- Alerts List ---- */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        /* ---- Empty State ---- */
        <Card className="border-dashed border-2 border-gray-200 bg-white">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="text-emerald-500" size={36} />
            </div>
            <p className="text-gray-600 text-lg font-medium">
              لا توجد مواد على وشك النفاذ 🎉
            </p>
            <p className="text-gray-400 text-sm mt-1">
              جميع المواد ضمن الحدود المقبولة
            </p>
          </CardContent>
        </Card>
      ) : filteredAlerts.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 bg-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="text-gray-300 mb-4" size={56} />
            <p className="text-gray-500 text-lg font-medium">لا توجد تنبيهات لهذا المستوى</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAlerts.map((item) => {
            const level = getAlertLevel(item)
            const progressValue =
              item.minStock > 0
                ? Math.min(Math.round((item.quantity / item.minStock) * 100), 100)
                : 0

            return (
              <Card
                key={item.id}
                className={`border shadow-sm overflow-hidden ${getAlertBgClass(item)} transition-all hover:shadow-md`}
              >
                <CardContent className="p-5">
                  {/* Top: product name + level badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getAlertCardBgClass(item)} bg-opacity-10`}
                      >
                        <Package size={20} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 text-sm truncate">
                          {item.product?.name || 'مادة غير معروفة'}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.product?.category && (
                            <span className="text-xs text-gray-400">
                              {item.product.category.name}
                            </span>
                          )}
                          {item.product?.sku && (
                            <span className="text-xs text-gray-400">· {item.product.sku}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`flex-shrink-0 text-xs ${
                        level === 'critical'
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}
                    >
                      {level === 'critical' ? 'حرج' : 'تحذير'}
                    </Badge>
                  </div>

                  {/* Info rows */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/60 rounded-lg p-2.5">
                      <p className="text-xs text-gray-500 mb-0.5">المخزن</p>
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <Warehouse size={13} className="text-gray-400" />
                        {item.warehouse?.name || '—'}
                      </p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2.5">
                      <p className="text-xs text-gray-500 mb-0.5">الوحدة</p>
                      <p className="text-sm font-medium text-gray-700">
                        {item.unit?.name || 'قطعة'}
                      </p>
                    </div>
                  </div>

                  {/* Quantity details */}
                  <div className="bg-white/60 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">الكمية الحالية</span>
                      <span
                        className={`text-lg font-bold ${
                          item.quantity <= 0
                            ? 'text-red-600'
                            : item.quantity <= item.minStock / 2
                            ? 'text-amber-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {formatNumber(item.quantity)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500">الحد الأدنى</span>
                      <span className="text-sm font-medium text-gray-600">
                        {formatNumber(item.minStock)}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">النسبة المتبقية</span>
                        <span
                          className={`text-xs font-bold ${
                            item.quantity <= 0
                              ? 'text-red-600'
                              : item.quantity <= item.minStock / 2
                              ? 'text-amber-600'
                              : 'text-yellow-600'
                          }`}
                        >
                          {item.quantity <= 0 ? '٠٪' : `${formatNumber(progressValue)}٪`}
                        </span>
                      </div>
                      <Progress
                        value={item.quantity <= 0 ? 0 : progressValue}
                        className={`h-2 bg-gray-200 ${getProgressColor(item)}`}
                      />
                    </div>
                  </div>

                  {/* Action */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 h-9 text-sm border-gray-300 hover:bg-white text-gray-700"
                    onClick={() => handleReorder(item)}
                  >
                    <RotateCcw size={14} />
                    إعادة طلب
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
