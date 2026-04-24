'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Warehouse, MapPin, Phone, Package, Loader2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WarehouseData {
  id: string
  name: string
  address: string | null
  phone: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: { stocks: number; invoices: number }
  totalStockValue: number
  productCount: number
}

interface WarehouseFormData {
  name: string
  address: string
  phone: string
  notes: string
}

interface StockItem {
  id: string
  quantity: number
  minStock: number
  updatedAt: string
  product: {
    id: string
    name: string
    sku: string | null
    barcode: string | null
    costPrice: number
    category: { name: string } | null
  }
  unit: { id: string; name: string; conversionFactor: number } | null
}

const emptyForm: WarehouseFormData = {
  name: '',
  address: '',
  phone: '',
  notes: '',
}

/* ------------------------------------------------------------------ */
/*  Number formatter                                                   */
/* ------------------------------------------------------------------ */

function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '٠'
  return num.toLocaleString('ar-IQ')
}

function formatCurrency(value: number): string {
  return formatNumber(Math.round(value * 100) / 100)
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function WarehousesView() {
  /* ---- state ---- */
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([])
  const [loading, setLoading] = useState(true)

  /* warehouse form dialog */
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null)
  const [form, setForm] = useState<WarehouseFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  /* delete dialog */
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingWarehouse, setDeletingWarehouse] = useState<WarehouseData | null>(null)
  const [deleting, setDeleting] = useState(false)

  /* stock detail dialog */
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [stockWarehouse, setStockWarehouse] = useState<WarehouseData | null>(null)
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [stockLoading, setStockLoading] = useState(false)

  /* ================================================================ */
  /*  Data fetching                                                     */
  /* ================================================================ */

  const fetchWarehouses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/warehouses')
      if (!res.ok) throw new Error('خطأ في جلب المخازن')
      const data = await res.json()
      setWarehouses(data || [])
    } catch (err: any) {
      toast.error(err.message || 'خطأ في جلب المخازن')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWarehouses()
  }, [fetchWarehouses])

  const fetchStockDetail = useCallback(async (warehouseId: string) => {
    setStockLoading(true)
    try {
      const res = await fetch(`/api/stock?warehouseId=${warehouseId}`)
      if (!res.ok) throw new Error('خطأ في جلب المخزون')
      const data = await res.json()
      setStockItems(data || [])
    } catch (err: any) {
      toast.error(err.message || 'خطأ في جلب المخزون')
    } finally {
      setStockLoading(false)
    }
  }, [])

  /* ================================================================ */
  /*  Form handlers                                                     */
  /* ================================================================ */

  const openAddDialog = () => {
    setEditingWarehouse(null)
    setForm(emptyForm)
    setFormDialogOpen(true)
  }

  const openEditDialog = (warehouse: WarehouseData) => {
    setEditingWarehouse(warehouse)
    setForm({
      name: warehouse.name,
      address: warehouse.address || '',
      phone: warehouse.phone || '',
      notes: warehouse.notes || '',
    })
    setFormDialogOpen(true)
  }

  const updateField = (field: keyof WarehouseFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('اسم المخزن مطلوب')
      return
    }

    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        notes: form.notes.trim() || null,
      }

      const url = editingWarehouse
        ? `/api/warehouses/${editingWarehouse.id}`
        : '/api/warehouses'
      const method = editingWarehouse ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'خطأ في حفظ المخزن')
      }

      toast.success(editingWarehouse ? 'تم تحديث المخزن بنجاح' : 'تم إضافة المخزن بنجاح')
      setFormDialogOpen(false)
      setEditingWarehouse(null)
      fetchWarehouses()
    } catch (err: any) {
      toast.error(err.message || 'خطأ في حفظ المخزن')
    } finally {
      setSaving(false)
    }
  }

  /* ================================================================ */
  /*  Delete handlers                                                   */
  /* ================================================================ */

  const openDeleteDialog = (warehouse: WarehouseData) => {
    setDeletingWarehouse(warehouse)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingWarehouse) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/warehouses/${deletingWarehouse.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'خطأ في حذف المخزن')
      }
      toast.success('تم حذف المخزن بنجاح')
      setDeleteDialogOpen(false)
      setDeletingWarehouse(null)
      fetchWarehouses()
    } catch (err: any) {
      toast.error(err.message || 'خطأ في حذف المخزن')
    } finally {
      setDeleting(false)
    }
  }

  /* ================================================================ */
  /*  Stock detail handlers                                             */
  /* ================================================================ */

  const openStockDetail = (warehouse: WarehouseData) => {
    setStockWarehouse(warehouse)
    setStockItems([])
    setStockDialogOpen(true)
    fetchStockDetail(warehouse.id)
  }

  /* ================================================================ */
  /*  Render                                                            */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/*  Top Bar                                                       */}
      {/* ============================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-800">إدارة المخازن</h2>

        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={openAddDialog}
        >
          <Plus className="size-4" />
          إضافة مخزن جديد
        </Button>
      </div>

      {/* ============================================================== */}
      {/*  Warehouses Grid                                               */}
      {/* ============================================================== */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-44" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : warehouses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
          <Warehouse className="size-16 opacity-40" />
          <p className="text-lg font-medium">لا توجد مخازن</p>
          <p className="text-sm">ابدأ بإضافة مخزن جديد</p>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
            onClick={openAddDialog}
          >
            <Plus className="size-4" />
            إضافة مخزن جديد
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((warehouse) => (
            <Card
              key={warehouse.id}
              className="overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer group"
              onClick={() => openStockDetail(warehouse)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                      <Warehouse className="size-5 text-emerald-600" />
                    </div>
                    <CardTitle className="text-base font-bold text-gray-800 truncate">
                      {warehouse.name}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 flex-shrink-0 text-xs"
                  >
                    {formatNumber(warehouse.productCount)} مادة
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {/* Address */}
                {warehouse.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="size-3.5 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{warehouse.address}</span>
                  </div>
                )}

                {/* Phone */}
                {warehouse.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="size-3.5 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{warehouse.phone}</span>
                  </div>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Package className="size-3.5 text-gray-400" />
                    <span className="text-gray-600">
                      {formatNumber(warehouse.productCount)} مادة
                    </span>
                  </div>
                </div>

                {/* Total value */}
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500">قيمة المخزون</span>
                  <p className="text-base font-bold text-emerald-700">
                    {formatCurrency(warehouse.totalStockValue)} <span className="text-xs font-normal text-gray-500">د.ع</span>
                  </p>
                </div>

                {/* Notes */}
                {warehouse.notes && (
                  <p className="text-xs text-gray-400 truncate">{warehouse.notes}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 pt-1 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 text-xs gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditDialog(warehouse)
                    }}
                  >
                    <Edit className="size-3.5" />
                    تعديل
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-red-600 hover:bg-red-50 text-xs gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation()
                      openDeleteDialog(warehouse)
                    }}
                  >
                    <Trash2 className="size-3.5" />
                    حذف
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-amber-600 hover:bg-amber-50 text-xs gap-1.5 mr-auto"
                    onClick={(e) => {
                      e.stopPropagation()
                      openStockDetail(warehouse)
                    }}
                  >
                    <Package className="size-3.5" />
                    المخزون
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/*  Add / Edit Warehouse Dialog                                   */}
      {/* ============================================================== */}
      <Dialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open)
          if (!open) {
            setEditingWarehouse(null)
            setForm(emptyForm)
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? 'تعديل مخزن' : 'إضافة مخزن جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingWarehouse
                ? 'قم بتعديل بيانات المخزن'
                : 'أدخل بيانات المخزن الجديد'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="wh-name">
                الاسم <span className="text-red-500">*</span>
              </Label>
              <Input
                id="wh-name"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="أدخل اسم المخزن"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="wh-address">العنوان</Label>
              <Input
                id="wh-address"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="أدخل عنوان المخزن"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="wh-phone">الهاتف</Label>
              <Input
                id="wh-phone"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="أدخل رقم الهاتف"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="wh-notes">ملاحظات</Label>
              <Textarea
                id="wh-notes"
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="ملاحظات إضافية (اختياري)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setFormDialogOpen(false)}
              disabled={saving}
            >
              إلغاء
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px]"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/*  Delete Confirmation Dialog                                    */}
      {/* ============================================================== */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المخزن؟
              {deletingWarehouse && (
                <span className="block mt-2 font-semibold text-foreground">
                  &laquo;{deletingWarehouse.name}&raquo;
                </span>
              )}
              {deletingWarehouse &&
                (deletingWarehouse._count.stocks > 0 ||
                  deletingWarehouse._count.invoices > 0) && (
                  <span className="block mt-1 text-red-500 text-sm">
                    ⚠ هذا المخزن يحتوي على مخزون أو فواتير مرتبطة وسيتم رفض الحذف.
                  </span>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================================== */}
      {/*  Warehouse Stock Detail Dialog                                 */}
      {/* ============================================================== */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warehouse className="size-5 text-emerald-600" />
              {stockWarehouse?.name ?? 'مخزون المخزن'}
            </DialogTitle>
            <DialogDescription>
              جميع المواد الموجودة في هذا المخزن وحالتها
            </DialogDescription>
          </DialogHeader>

          {/* Summary stats */}
          {stockWarehouse && (
            <div className="flex items-center gap-4 text-sm text-gray-500 border-b pb-3">
              <span>{formatNumber(stockItems.length)} مادة</span>
              <span>•</span>
              <span>
                قيمة المخزون:{' '}
                <span className="font-bold text-emerald-700">
                  {formatCurrency(
                    stockItems.reduce(
                      (sum, item) => sum + item.quantity * (item.product?.costPrice ?? 0),
                      0
                    )
                  )}{' '}
                  د.ع
                </span>
              </span>
            </div>
          )}

          {/* Stock table */}
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {stockLoading ? (
              <div className="space-y-3 py-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : stockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                <Package className="size-12 opacity-40" />
                <p className="text-sm">لا توجد مواد في هذا المخزن</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="text-right font-semibold">المادة</TableHead>
                    <TableHead className="text-right font-semibold">الوحدة</TableHead>
                    <TableHead className="text-right font-semibold">الكمية</TableHead>
                    <TableHead className="text-right font-semibold">الحد الأدنى</TableHead>
                    <TableHead className="text-right font-semibold">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockItems.map((item) => {
                    const isOk = item.quantity > item.minStock
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-gray-800">
                          {item.product.name}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {item.unit?.name || 'قطعة'}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {formatNumber(item.quantity)}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {formatNumber(item.minStock)}
                        </TableCell>
                        <TableCell>
                          {isOk ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                              جيد
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              منخفض
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStockDialogOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
