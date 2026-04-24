'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Edit, Trash2, Package, FolderOpen, X, Loader2 } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Category {
  id: string
  name: string
  createdAt: string
  _count?: { products: number }
}

interface ProductUnit {
  id?: string
  name: string
  barcode: string
  conversionFactor: number
  costPrice: number
  sellPrice: number
  isDefault: boolean
}

interface Product {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  categoryId: string | null
  description: string | null
  costPrice: number
  sellPrice: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  category: { id: string; name: string } | null
  units: ProductUnit[]
  totalStock: number
  lowStock: boolean
}

interface ProductFormData {
  name: string
  sku: string
  barcode: string
  categoryId: string
  description: string
  costPrice: string
  sellPrice: string
  units: ProductUnit[]
}

const emptyForm: ProductFormData = {
  name: '',
  sku: '',
  barcode: '',
  categoryId: '',
  description: '',
  costPrice: '',
  sellPrice: '',
  units: [
    {
      name: 'قطعة',
      barcode: '',
      conversionFactor: 1,
      costPrice: '',
      sellPrice: '',
      isDefault: true,
    } as any,
  ],
}

const defaultNewUnit = (): ProductUnit => ({
  name: '',
  barcode: '',
  conversionFactor: 1,
  costPrice: 0,
  sellPrice: 0,
  isDefault: false,
})

/* ------------------------------------------------------------------ */
/*  Number formatter                                                   */
/* ------------------------------------------------------------------ */

function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '٠'
  return num.toLocaleString('ar-IQ')
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function ProductsView() {
  /* ---- state ---- */
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  /* product dialog */
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  /* delete dialog */
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  /* categories dialog */
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)

  /* ---- helpers ---- */
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('q', debouncedSearch)
      if (categoryFilter) params.set('categoryId', categoryFilter)
      const res = await fetch(`/api/products?${params.toString()}`)
      if (!res.ok) throw new Error('خطأ في جلب المواد')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (err: any) {
      toast.error(err.message || 'خطأ في جلب المواد')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, categoryFilter])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCategories(data || [])
    } catch {
      /* silent */
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  /* ---- search debounce ---- */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  /* ---- product form handlers ---- */
  const openAddDialog = () => {
    setEditingProduct(null)
    setForm({
      ...emptyForm,
      units: [{ name: 'قطعة', barcode: '', conversionFactor: 1, costPrice: 0, sellPrice: 0, isDefault: true }],
    })
    setProductDialogOpen(true)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      sku: product.sku || '',
      barcode: product.barcode || '',
      categoryId: product.categoryId || '',
      description: product.description || '',
      costPrice: String(product.costPrice),
      sellPrice: String(product.sellPrice),
      units: product.units.length
        ? product.units.map((u) => ({
            id: u.id,
            name: u.name,
            barcode: u.barcode || '',
            conversionFactor: u.conversionFactor,
            costPrice: u.costPrice,
            sellPrice: u.sellPrice,
            isDefault: u.isDefault,
          }))
        : [
            {
              name: 'قطعة',
              barcode: '',
              conversionFactor: 1,
              costPrice: product.costPrice,
              sellPrice: product.sellPrice,
              isDefault: true,
            },
          ],
    })
    setProductDialogOpen(true)
  }

  const updateField = (field: keyof ProductFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateUnit = (index: number, field: keyof ProductUnit, value: any) => {
    setForm((prev) => {
      const units = [...prev.units]
      units[index] = { ...units[index], [field]: value }
      // If this unit is set as default, unset others
      if (field === 'isDefault' && value) {
        units.forEach((u, i) => {
          if (i !== index) u.isDefault = false
        })
      }
      return { ...prev, units }
    })
  }

  const addUnit = () => {
    setForm((prev) => ({
      ...prev,
      units: [...prev.units, defaultNewUnit()],
    }))
  }

  const removeUnit = (index: number) => {
    if (form.units.length <= 1) {
      toast.error('يجب أن تكون هناك وحدة واحدة على الأقل')
      return
    }
    setForm((prev) => {
      const units = prev.units.filter((_, i) => i !== index)
      // If the removed unit was default, set first as default
      const hadDefault = prev.units[index]?.isDefault
      if (hadDefault && units.length > 0) {
        units[0].isDefault = true
      }
      return { ...prev, units }
    })
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('اسم المادة مطلوب')
      return
    }
    if (form.units.length === 0) {
      toast.error('يجب إضافة وحدة واحدة على الأقل')
      return
    }
    const hasEmptyUnit = form.units.some((u) => !u.name.trim())
    if (hasEmptyUnit) {
      toast.error('يجب تحديد اسم لكل وحدة')
      return
    }

    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        sku: form.sku.trim() || null,
        barcode: form.barcode.trim() || null,
        categoryId: form.categoryId || null,
        description: form.description.trim() || null,
        costPrice: parseFloat(form.costPrice) || 0,
        sellPrice: parseFloat(form.sellPrice) || 0,
        units: form.units.map((u) => ({
          name: u.name.trim(),
          barcode: u.barcode.trim() || null,
          conversionFactor: parseFloat(String(u.conversionFactor)) || 1,
          costPrice: parseFloat(String(u.costPrice)) || 0,
          sellPrice: parseFloat(String(u.sellPrice)) || 0,
          isDefault: u.isDefault,
        })),
      }

      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'خطأ في حفظ المادة')
      }

      toast.success(editingProduct ? 'تم تحديث المادة بنجاح' : 'تم إضافة المادة بنجاح')
      setProductDialogOpen(false)
      fetchProducts()
      fetchCategories()
    } catch (err: any) {
      toast.error(err.message || 'خطأ في حفظ المادة')
    } finally {
      setSaving(false)
    }
  }

  /* ---- delete handlers ---- */
  const openDeleteDialog = (product: Product) => {
    setDeletingProduct(product)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingProduct) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'خطأ في حذف المادة')
      }
      toast.success('تم حذف المادة بنجاح')
      setDeleteDialogOpen(false)
      setDeletingProduct(null)
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'خطأ في حذف المادة')
    } finally {
      setDeleting(false)
    }
  }

  /* ---- category handlers ---- */
  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      toast.error('اسم التصنيف مطلوب')
      return
    }
    setAddingCat(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'خطأ في إضافة التصنيف')
      }
      toast.success('تم إضافة التصنيف بنجاح')
      setNewCatName('')
      fetchCategories()
    } catch (err: any) {
      toast.error(err.message || 'خطأ في إضافة التصنيف')
    } finally {
      setAddingCat(false)
    }
  }

  const handleDeleteCategory = async (catId: string) => {
    try {
      const res = await fetch(`/api/categories/${catId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'خطأ في حذف التصنيف')
      }
      toast.success('تم حذف التصنيف بنجاح')
      fetchCategories()
      // If the deleted category was the filter, clear it
      if (categoryFilter === catId) {
        setCategoryFilter('')
      }
    } catch (err: any) {
      toast.error(err.message || 'خطأ في حذف التصنيف')
    }
  }

  /* ---- category lookup helper ---- */
  const getCategoryName = (catId: string | null) => {
    if (!catId) return '—'
    return categories.find((c) => c.id === catId)?.name || '—'
  }

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/*  Top Bar                                                       */}
      {/* ============================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-800">إدارة المواد</h2>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="بحث عن مادة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52 sm:w-64 pr-9"
            />
          </div>

          {/* Category filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="كل الفئات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">كل الفئات</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Manage categories */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCatDialogOpen(true)}
          >
            <FolderOpen className="size-4" />
            <span className="hidden sm:inline">إدارة الفئات</span>
          </Button>

          {/* Add product */}
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={openAddDialog}
          >
            <Plus className="size-4" />
            إضافة مادة جديدة
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/*  Products Table                                                */}
      {/* ============================================================== */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            /* ---- loading skeleton ---- */
            <div className="p-6 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24 flex-shrink-0" />
                  <Skeleton className="h-4 w-20 flex-shrink-0" />
                  <Skeleton className="h-4 w-28 flex-shrink-0" />
                  <Skeleton className="h-4 w-16 flex-shrink-0" />
                  <Skeleton className="h-4 w-14 flex-shrink-0" />
                  <Skeleton className="h-4 w-14 flex-shrink-0" />
                  <Skeleton className="h-4 w-12 flex-shrink-0" />
                  <Skeleton className="h-5 w-12 flex-shrink-0" />
                  <Skeleton className="h-8 w-16 flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* ---- empty state ---- */
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
              <Package className="size-16 opacity-40" />
              <p className="text-lg font-medium">لا توجد مواد</p>
              <p className="text-sm">
                {search || categoryFilter
                  ? 'لم يتم العثور على مواد مطابقة للبحث'
                  : 'ابدأ بإضافة مادة جديدة'}
              </p>
              {!search && !categoryFilter && (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
                  onClick={openAddDialog}
                >
                  <Plus className="size-4" />
                  إضافة مادة جديدة
                </Button>
              )}
            </div>
          ) : (
            /* ---- data table ---- */
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-50 z-10">
                  <TableRow>
                    <TableHead className="text-right font-semibold">الاسم</TableHead>
                    <TableHead className="text-right font-semibold">الكود</TableHead>
                    <TableHead className="text-right font-semibold">الباركود</TableHead>
                    <TableHead className="text-right font-semibold">الفئة</TableHead>
                    <TableHead className="text-right font-semibold">سعر الشراء</TableHead>
                    <TableHead className="text-right font-semibold">سعر البيع</TableHead>
                    <TableHead className="text-right font-semibold">المخزون</TableHead>
                    <TableHead className="text-right font-semibold">الحالة</TableHead>
                    <TableHead className="text-right font-semibold">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-gray-800">
                        {product.name}
                        {product.units.length > 1 && (
                          <span className="text-xs text-gray-400 mr-1">
                            ({product.units.length} وحدات)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500">{product.sku || '—'}</TableCell>
                      <TableCell className="text-gray-500 font-mono text-xs">
                        {product.barcode || '—'}
                      </TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="secondary">{product.category.name}</Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatNumber(product.costPrice)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatNumber(product.sellPrice)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            product.lowStock
                              ? 'text-red-600 font-semibold'
                              : 'text-gray-700'
                          }
                        >
                          {formatNumber(product.totalStock)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {product.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                            نشط
                          </Badge>
                        ) : (
                          <Badge variant="destructive">غير نشط</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                            onClick={() => openEditDialog(product)}
                            title="تعديل"
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => openDeleteDialog(product)}
                            title="حذف"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/*  Add / Edit Product Dialog                                      */}
      {/* ============================================================== */}
      <Dialog
        open={productDialogOpen}
        onOpenChange={(open) => {
          setProductDialogOpen(open)
          if (!open) setEditingProduct(null)
        }}
      >
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'تعديل مادة' : 'إضافة مادة جديدة'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'قم بتعديل بيانات المادة والوحدات'
                : 'أدخل بيانات المادة الجديدة'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* ---- Basic Info ---- */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide border-b pb-2">
                البيانات الأساسية
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="prod-name">
                    اسم المادة <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="prod-name"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="أدخل اسم المادة"
                  />
                </div>

                {/* SKU */}
                <div className="space-y-2">
                  <Label htmlFor="prod-sku">الكود (SKU)</Label>
                  <Input
                    id="prod-sku"
                    value={form.sku}
                    onChange={(e) => updateField('sku', e.target.value)}
                    placeholder="أدخل كود المادة"
                  />
                </div>

                {/* Barcode */}
                <div className="space-y-2">
                  <Label htmlFor="prod-barcode">الباركود</Label>
                  <Input
                    id="prod-barcode"
                    value={form.barcode}
                    onChange={(e) => updateField('barcode', e.target.value)}
                    placeholder="أدخل الباركود"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>الفئة</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(val) =>
                      updateField('categoryId', val === '__none__' ? '' : val)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">بدون فئة</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cost Price */}
                <div className="space-y-2">
                  <Label htmlFor="prod-cost">سعر الشراء</Label>
                  <Input
                    id="prod-cost"
                    type="number"
                    step="0.01"
                    value={form.costPrice}
                    onChange={(e) => updateField('costPrice', e.target.value)}
                    placeholder="0"
                  />
                </div>

                {/* Sell Price */}
                <div className="space-y-2">
                  <Label htmlFor="prod-sell">سعر البيع</Label>
                  <Input
                    id="prod-sell"
                    type="number"
                    step="0.01"
                    value={form.sellPrice}
                    onChange={(e) => updateField('sellPrice', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="prod-desc">الوصف</Label>
                <Textarea
                  id="prod-desc"
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="وصف المادة (اختياري)"
                  rows={3}
                />
              </div>
            </div>

            {/* ---- Multi-Packaging Units ---- */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  وحدات التعبئة
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addUnit}
                >
                  <Plus className="size-4" />
                  إضافة وحدة
                </Button>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="text-right text-xs">اسم الوحدة</TableHead>
                      <TableHead className="text-right text-xs">الباركود</TableHead>
                      <TableHead className="text-right text-xs">معامل التحويل</TableHead>
                      <TableHead className="text-right text-xs">سعر الشراء</TableHead>
                      <TableHead className="text-right text-xs">سعر البيع</TableHead>
                      <TableHead className="text-center text-xs">افتراضية</TableHead>
                      <TableHead className="text-center text-xs w-14">حذف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.units.map((unit, index) => (
                      <TableRow key={index}>
                        {/* Name */}
                        <TableCell className="p-2">
                          <Input
                            value={unit.name}
                            onChange={(e) =>
                              updateUnit(index, 'name', e.target.value)
                            }
                            placeholder="مثل: كرتونة"
                            className="h-8 text-sm"
                          />
                        </TableCell>
                        {/* Barcode */}
                        <TableCell className="p-2">
                          <Input
                            value={unit.barcode}
                            onChange={(e) =>
                              updateUnit(index, 'barcode', e.target.value)
                            }
                            placeholder="باركود"
                            className="h-8 text-sm font-mono"
                          />
                        </TableCell>
                        {/* Conversion Factor */}
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={unit.conversionFactor}
                            onChange={(e) =>
                              updateUnit(
                                index,
                                'conversionFactor',
                                parseFloat(e.target.value) || 1
                              )
                            }
                            className="h-8 text-sm w-20"
                          />
                        </TableCell>
                        {/* Cost Price */}
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={unit.costPrice}
                            onChange={(e) =>
                              updateUnit(
                                index,
                                'costPrice',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 text-sm w-24"
                          />
                        </TableCell>
                        {/* Sell Price */}
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={unit.sellPrice}
                            onChange={(e) =>
                              updateUnit(
                                index,
                                'sellPrice',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 text-sm w-24"
                          />
                        </TableCell>
                        {/* Default */}
                        <TableCell className="p-2 text-center">
                          <Checkbox
                            checked={unit.isDefault}
                            onCheckedChange={(checked) =>
                              updateUnit(index, 'isDefault', !!checked)
                            }
                          />
                        </TableCell>
                        {/* Delete */}
                        <TableCell className="p-2 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => removeUnit(index)}
                            disabled={form.units.length <= 1}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setProductDialogOpen(false)}
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
      {/*  Delete Confirmation Dialog                                     */}
      {/* ============================================================== */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه المادة؟
              {deletingProduct && (
                <span className="block mt-2 font-semibold text-foreground">
                  &laquo;{deletingProduct.name}&raquo;
                </span>
              )}
              لا يمكن التراجع عن هذا الإجراء.
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
      {/*  Categories Management Dialog                                   */}
      {/* ============================================================== */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="size-5" />
              إدارة الفئات
            </DialogTitle>
            <DialogDescription>
              أضف أو احذف فئات المواد
            </DialogDescription>
          </DialogHeader>

          {/* Add new category */}
          <div className="flex items-center gap-2">
            <Input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="اسم التصنيف الجديد"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCategory()
              }}
              className="flex-1"
            />
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleAddCategory}
              disabled={addingCat || !newCatName.trim()}
            >
              {addingCat ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              إضافة
            </Button>
          </div>

          {/* Categories list */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {categories.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                لا توجد فئات بعد
              </p>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-gray-700 truncate">
                      {cat.name}
                    </span>
                    {cat._count && cat._count.products > 0 && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {cat._count.products} مادة
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                    onClick={() => handleDeleteCategory(cat.id)}
                    title="حذف التصنيف"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
