'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Invoice, InvoiceType, InvoiceStatus } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  Printer,
  FileText,
  User,
  Building2,
  Warehouse,
  Calendar,
  DollarSign,
  ShoppingCart,
  Truck,
  RotateCcw,
  Undo2,
  Loader2,
  StickyNote,
  Phone,
  MapPin,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const typeLabels: Record<InvoiceType, string> = {
  sale: 'بيع',
  purchase: 'شراء',
  sale_return: 'إرجاع بيع',
  purchase_return: 'إرجاع شراء',
}

const typeIcons: Record<InvoiceType, React.ElementType> = {
  sale: ShoppingCart,
  purchase: Truck,
  sale_return: RotateCcw,
  purchase_return: Undo2,
}

const typeColors: Record<InvoiceType, string> = {
  sale: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  purchase: 'bg-amber-50 text-amber-700 border-amber-200',
  sale_return: 'bg-orange-50 text-orange-700 border-orange-200',
  purchase_return: 'bg-rose-50 text-rose-700 border-rose-200',
}

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: {
    label: 'مسودة',
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  confirmed: {
    label: 'مؤكدة',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  },
  cancelled: {
    label: 'ملغاة',
    className: 'bg-red-50 text-red-700 border-red-300',
  },
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatNumber(n: number) {
  return n.toLocaleString('ar-SA')
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function InvoiceDetail() {
  const { selectedInvoiceId, setCurrentPage } = useAppStore()

  /* ---- State ---- */
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const isCustomerType = invoice
    ? invoice.type === 'sale' || invoice.type === 'sale_return'
    : false

  /* ================================================================ */
  /*  Fetch invoice on mount / when ID changes                         */
  /* ================================================================ */
  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!selectedInvoiceId) {
        // Use microtask to avoid synchronous setState in effect
        await Promise.resolve()
        if (!cancelled) setLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/invoices/${selectedInvoiceId}`)
        if (cancelled) return
        if (!res.ok) {
          toast.error('الفاتورة غير موجودة')
          setCurrentPage('dashboard')
          return
        }
        const data = await res.json()
        if (!cancelled) setInvoice(data)
      } catch {
        if (!cancelled) toast.error('حدث خطأ أثناء جلب بيانات الفاتورة')
      }
      if (!cancelled) setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [selectedInvoiceId, setCurrentPage])

  const fetchInvoice = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`)
      if (!res.ok) {
        toast.error('الفاتورة غير موجودة')
        setCurrentPage('dashboard')
        return
      }
      const data = await res.json()
      setInvoice(data)
    } catch {
      toast.error('حدث خطأ أثناء جلب بيانات الفاتورة')
    }
    setLoading(false)
  }, [setCurrentPage])

  /* ================================================================ */
  /*  Confirm invoice                                                  */
  /* ================================================================ */
  const handleConfirm = async () => {
    if (!invoice) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'حدث خطأ أثناء تأكيد الفاتورة')
        return
      }
      toast.success('تم تأكيد الفاتورة بنجاح')
      setConfirmOpen(false)
      fetchInvoice(invoice.id)
    } catch {
      toast.error('حدث خطأ أثناء تأكيد الفاتورة')
    }
    setUpdating(false)
  }

  /* ================================================================ */
  /*  Cancel invoice                                                   */
  /* ================================================================ */
  const handleCancel = async () => {
    if (!invoice) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'حدث خطأ أثناء إلغاء الفاتورة')
        return
      }
      toast.success('تم إلغاء الفاتورة بنجاح')
      setCancelOpen(false)
      fetchInvoice(invoice.id)
    } catch {
      toast.error('حدث خطأ أثناء إلغاء الفاتورة')
    }
    setUpdating(false)
  }

  /* ================================================================ */
  /*  No invoice selected                                              */
  /* ================================================================ */
  if (!selectedInvoiceId && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <FileText size={36} className="text-gray-400" />
        </div>
        <p className="text-lg font-semibold text-gray-600 mb-2">
          لم يتم تحديد فاتورة
        </p>
        <p className="text-sm text-gray-400 mb-6">
          اختر فاتورة من القائمة لعرض تفاصيلها
        </p>
        <Button
          variant="outline"
          onClick={() => setCurrentPage('dashboard')}
          className="gap-2"
        >
          <ArrowRight size={16} />
          العودة للوحة التحكم
        </Button>
      </div>
    )
  }

  /* ================================================================ */
  /*  Loading skeleton                                                 */
  /* ================================================================ */
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>

        {/* Info cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>

        {/* Table skeleton */}
        <Skeleton className="h-64 rounded-xl" />

        {/* Totals skeleton */}
        <Skeleton className="h-56 rounded-xl" />
      </div>
    )
  }

  if (!invoice) return null

  /* ================================================================ */
  /*  Computed values                                                  */
  /* ================================================================ */
  const remaining = invoice.total - invoice.paidAmount
  const TypeIcon = typeIcons[invoice.type as InvoiceType] || FileText
  const statusInfo = statusConfig[invoice.status as InvoiceStatus]

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/*  Header                                                       */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            <div
              className={`p-2.5 rounded-xl border ${typeColors[invoice.type as InvoiceType]}`}
            >
              <TypeIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                  فاتورة {typeLabels[invoice.type as InvoiceType]}
                </h1>
                <Badge
                  variant="outline"
                  className={`text-xs font-medium border ${statusInfo.className}`}
                >
                  {statusInfo.label}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{invoice.invoiceNo}</p>
            </div>
          </div>
        </div>

        {/* Action buttons - hidden when printing */}
        <div className="flex items-center gap-2 print:hidden">
          {invoice.status === 'draft' && (
            <>
              <Button
                onClick={() => setConfirmOpen(true)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={updating}
              >
                {updating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                تأكيد الفاتورة
              </Button>
              <Button
                variant="destructive"
                onClick={() => setCancelOpen(true)}
                className="gap-2"
                disabled={updating}
              >
                <XCircle size={16} />
                إلغاء الفاتورة
              </Button>
            </>
          )}
          {invoice.status === 'confirmed' && (
            <Button
              variant="destructive"
              onClick={() => setCancelOpen(true)}
              className="gap-2"
              disabled={updating}
            >
              {updating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <XCircle size={16} />
              )}
              إلغاء الفاتورة
            </Button>
          )}
          <Separator orientation="vertical" className="h-8 mx-1" />
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="gap-2"
          >
            <Printer size={16} />
            طباعة
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage('dashboard')}
            className="gap-2"
          >
            <ArrowRight size={16} />
            رجوع
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Info cards (Party + Invoice meta)                            */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Party Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
              {isCustomerType ? (
                <>
                  <User size={18} className="text-emerald-600" />
                  معلومات الزبون
                </>
              ) : (
                <>
                  <Building2 size={18} className="text-amber-600" />
                  معلومات المجهز
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isCustomerType && invoice.customer ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {invoice.customer.name}
                    </p>
                    {invoice.customer.email && (
                      <p className="text-sm text-gray-400">
                        {invoice.customer.email}
                      </p>
                    )}
                  </div>
                </div>
                {invoice.customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mr-13">
                    <Phone size={14} className="text-gray-400" />
                    <span>{invoice.customer.phone}</span>
                  </div>
                )}
                {invoice.customer.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mr-13">
                    <MapPin size={14} className="text-gray-400 mt-0.5" />
                    <span>{invoice.customer.address}</span>
                  </div>
                )}
              </>
            ) : !isCustomerType && invoice.supplier ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {invoice.supplier.name}
                    </p>
                    {invoice.supplier.email && (
                      <p className="text-sm text-gray-400">
                        {invoice.supplier.email}
                      </p>
                    )}
                  </div>
                </div>
                {invoice.supplier.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mr-13">
                    <Phone size={14} className="text-gray-400" />
                    <span>{invoice.supplier.phone}</span>
                  </div>
                )}
                {invoice.supplier.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mr-13">
                    <MapPin size={14} className="text-gray-400 mt-0.5" />
                    <span>{invoice.supplier.address}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400 py-2">
                {isCustomerType ? 'لم يتم تحديد زبون' : 'لم يتم تحديد مجهز'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Invoice Meta Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
              <FileText size={18} className="text-gray-500" />
              معلومات الفاتورة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">رقم الفاتورة</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {invoice.invoiceNo}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">التاريخ</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {formatDate(invoice.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Warehouse size={14} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">المخزن</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {invoice.warehouse?.name || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${
                    invoice.status === 'confirmed'
                      ? 'bg-emerald-500 border-emerald-500'
                      : invoice.status === 'cancelled'
                        ? 'bg-red-500 border-red-500'
                        : 'bg-gray-400 border-gray-400'
                  }`}
                />
                <div>
                  <p className="text-xs text-gray-400">الحالة</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {statusInfo.label}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/*  Items Table + Totals (two column on desktop)                 */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items Table - 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-700">
              مواد الفاتورة
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {!invoice.items || invoice.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <ShoppingCart size={28} className="text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">لا توجد مواد في هذه الفاتورة</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="w-[50px] text-center font-semibold">
                        #
                      </TableHead>
                      <TableHead className="min-w-[180px] font-semibold">
                        المادة
                      </TableHead>
                      <TableHead className="min-w-[100px] font-semibold">
                        الوحدة
                      </TableHead>
                      <TableHead className="min-w-[90px] text-center font-semibold">
                        الكمية
                      </TableHead>
                      <TableHead className="min-w-[110px] text-left font-semibold">
                        السعر
                      </TableHead>
                      <TableHead className="min-w-[120px] text-left font-semibold">
                        الإجمالي
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center text-sm text-gray-400 font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {item.productName}
                            </p>
                            {item.product?.sku && (
                              <p className="text-xs text-gray-400">
                                {item.product.sku}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {item.unitName || 'قطعة'}
                          {item.unit?.conversionFactor &&
                            item.unit.conversionFactor > 1 && (
                              <span className="text-xs text-gray-400 mr-1">
                                (×{item.unit.conversionFactor})
                              </span>
                            )}
                        </TableCell>
                        <TableCell className="text-center text-sm font-medium text-gray-700">
                          {formatNumber(item.quantity)}
                        </TableCell>
                        <TableCell className="text-left text-sm text-gray-600">
                          {formatNumber(item.price)} <span className="text-xs text-gray-400">ل.س</span>
                        </TableCell>
                        <TableCell className="text-left text-sm font-semibold text-gray-800">
                          {formatNumber(item.total)} <span className="text-xs text-gray-400">ل.س</span>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Footer totals row */}
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 font-semibold">
                      <TableCell colSpan={5} className="text-left text-sm text-gray-700">
                        المجموع
                      </TableCell>
                      <TableCell className="text-left text-sm font-bold text-gray-800">
                        {formatNumber(invoice.subtotal)} <span className="text-xs">ل.س</span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Totals Card - 1/3 width */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-600" />
              حساب الفاتورة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Subtotal */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">المجموع الفرعي</span>
                <span className="text-sm font-semibold text-gray-700">
                  {formatNumber(invoice.subtotal)} ل.س
                </span>
              </div>

              <Separator className="my-1" />

              {/* Discount */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">الخصم</span>
                <span className="text-sm font-medium text-red-600">
                  - {formatNumber(invoice.discount)} ل.س
                </span>
              </div>

              {/* Tax */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">الضريبة</span>
                <span className="text-sm font-medium text-gray-700">
                  {formatNumber(invoice.tax)} ل.س
                </span>
              </div>

              <Separator className="my-1" />

              {/* Total - large bold */}
              <div className="flex items-center justify-between py-3 bg-emerald-50 rounded-lg px-3 -mx-1">
                <span className="text-base font-bold text-emerald-800">
                  الإجمالي
                </span>
                <span className="text-lg font-bold text-emerald-700">
                  {formatNumber(invoice.total)} ل.س
                </span>
              </div>

              <Separator className="my-1" />

              {/* Paid Amount */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">المبلغ المدفوع</span>
                <span className="text-sm font-semibold text-gray-700">
                  {formatNumber(invoice.paidAmount)} ل.س
                </span>
              </div>

              {/* Remaining */}
              <div className="flex items-center justify-between py-3 bg-gray-50 rounded-lg px-3 -mx-1">
                <span className="text-sm font-semibold text-gray-600">
                  المبلغ المتبقي
                </span>
                <span
                  className={`text-sm font-bold ${
                    remaining > 0
                      ? 'text-red-600'
                      : remaining < 0
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                  }`}
                >
                  {formatNumber(Math.abs(remaining))} ل.س
                  {remaining > 0 && (
                    <span className="text-xs mr-1">مدين</span>
                  )}
                  {remaining < 0 && (
                    <span className="text-xs mr-1">دائن</span>
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/*  Notes                                                         */}
      {/* ============================================================ */}
      {invoice.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
              <StickyNote size={18} className="text-amber-500" />
              ملاحظات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/*  Bottom action buttons (mobile) - hidden when printing        */}
      {/* ============================================================ */}
      <div className="flex items-center gap-3 lg:hidden print:hidden pt-2">
        {invoice.status === 'draft' && (
          <Button
            onClick={() => setConfirmOpen(true)}
            className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={updating}
          >
            {updating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            تأكيد
          </Button>
        )}
        {(invoice.status === 'draft' || invoice.status === 'confirmed') && (
          <Button
            variant="destructive"
            onClick={() => setCancelOpen(true)}
            className="flex-1 gap-2"
            disabled={updating}
          >
            <XCircle size={16} />
            إلغاء
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="gap-2"
        >
          <Printer size={16} />
          طباعة
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentPage('dashboard')}
          className="gap-2"
        >
          <ArrowRight size={16} />
          رجوع
        </Button>
      </div>

      {/* ============================================================ */}
      {/*  Confirm Dialog                                                */}
      {/* ============================================================ */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-right">
              <CheckCircle size={20} className="text-emerald-600" />
              تأكيد الفاتورة
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-relaxed">
              هل أنت متأكد من تأكيد هذه الفاتورة؟
              <br />
              بعد التأكيد سيتم تحديث أرصدة المخزون والحسابات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={updating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {updating ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  جاري التأكيد...
                </span>
              ) : (
                'نعم، تأكيد'
              )}
            </AlertDialogAction>
            <AlertDialogCancel disabled={updating}>
              تراجع
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================================ */}
      {/*  Cancel Dialog                                                 */}
      {/* ============================================================ */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-right">
              <XCircle size={20} className="text-red-600" />
              إلغاء الفاتورة
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-relaxed">
              هل أنت متأكد من إلغاء هذه الفاتورة؟
              {invoice.status === 'confirmed' && (
                <>
                  <br />
                  <span className="text-red-600 font-medium">
                    ⚠️ تحذير: الفاتورة مؤكدة بالفعل. سيتم عكس جميع العمليات
                    المرتبطة بها (المخزون والأرصدة).
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={handleCancel}
              disabled={updating}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {updating ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  جاري الإلغاء...
                </span>
              ) : (
                'نعم، إلغاء'
              )}
            </AlertDialogAction>
            <AlertDialogCancel disabled={updating}>
              تراجع
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
