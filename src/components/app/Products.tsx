'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2, Search, Package, PlusCircle, X } from 'lucide-react'

function formatNumber(n: number) {
  return new Intl.NumberFormat('ar-SY').format(Math.round(n))
}

interface ProductUnitForm {
  name: string
  barcode: string
  conversionFactor: string
  costPrice: string
  sellPrice: string
}

interface ProductForm {
  name: string
  sku: string
  barcode: string
  categoryId: string
  description: string
  costPrice: string
  sellPrice: string
  units: ProductUnitForm[]
}

const emptyUnit = (): ProductUnitForm => ({
  name: '', barcode: '', conversionFactor: '1', costPrice: '', sellPrice: ''
})

const emptyForm = (): ProductForm => ({
  name: '', sku: '', barcode: '', categoryId: '', description: '',
  costPrice: '', sellPrice: '', units: [emptyUnit()]
})

export default function Products() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm())
  const [newCatName, setNewCatName] = useState('')

  const fetchProducts = useCallback(() => {
    setLoading(true)
    let url = '/api/products?limit=100'
    if (search) url += `&search=${encodeURIComponent(search)}`
    fetch(url)
      .then(r => r.json())
      .then(data => { setProducts(data.products || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [search])

  const fetchCategories = useCallback(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(data || []))
  }, [])

  useEffect(() => { fetchProducts(); fetchCategories() }, [fetchProducts, fetchCategories])

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('اسم المنتج مطلوب'); return }
    if (form.units.length === 0 || !form.units[0].name.trim()) { toast.error('وحدة واحدة على الأقل مطلوبة'); return }

    const body = {
      ...form,
      costPrice: form.costPrice || '0',
      sellPrice: form.sellPrice || '0',
      units: form.units.map(u => ({
        ...u,
        conversionFactor: u.conversionFactor || '1',
        costPrice: u.costPrice || '0',
        sellPrice: u.sellPrice || '0',
      })),
    }

    try {
      if (editId) {
        const res = await fetch(`/api/products/${editId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        })
        if (res.ok) toast.success('تم تحديث المنتج')
        else { const e = await res.json(); toast.error(e.error) }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        })
        if (res.ok) toast.success('تم إنشاء المنتج')
        else { const e = await res.json(); toast.error(e.error) }
      }
      setDialogOpen(false)
      setEditId(null)
      setForm(emptyForm())
      fetchProducts()
    } catch { toast.error('خطأ في الحفظ') }
  }

  const handleEdit = (p: any) => {
    setEditId(p.id)
    setForm({
      name: p.name, sku: p.sku || '', barcode: p.barcode || '',
      categoryId: p.categoryId || '', description: p.description || '',
      costPrice: String(p.costPrice), sellPrice: String(p.sellPrice),
      units: p.units?.length > 0
        ? p.units.map((u: any) => ({
            name: u.name, barcode: u.barcode || '',
            conversionFactor: String(u.conversionFactor),
            costPrice: String(u.costPrice), sellPrice: String(u.sellPrice),
          }))
        : [emptyUnit()]
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (res.ok) toast.success('تم حذف المنتج')
      else toast.error('خطأ في الحذف')
      fetchProducts()
    } catch { toast.error('خطأ في الحذف') }
  }

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    try {
      const res = await fetch('/api/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCatName })
      })
      if (res.ok) { toast.success('تم إضافة التصنيف'); setNewCatName(''); fetchCategories() }
      else { const e = await res.json(); toast.error(e.error) }
    } catch { toast.error('خطأ في إضافة التصنيف') }
  }

  const updateUnit = (idx: number, field: keyof ProductUnitForm, value: string) => {
    const newUnits = [...form.units]
    newUnits[idx] = { ...newUnits[idx], [field]: value }
    setForm({ ...form, units: newUnits })
  }

  const addUnit = () => setForm({ ...form, units: [...form.units, emptyUnit()] })
  const removeUnit = (idx: number) => {
    if (form.units.length <= 1) return
    setForm({ ...form, units: form.units.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="بحث عن منتج..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatDialogOpen(true)}>
            <Package size={16} className="ml-1" /> التصنيفات
          </Button>
          <Button onClick={() => { setEditId(null); setForm(emptyForm()); setDialogOpen(true) }}>
            <Plus size={16} className="ml-1" /> إضافة منتج
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">SKU</TableHead>
                    <TableHead className="text-right">الباركود</TableHead>
                    <TableHead className="text-right">التصنيف</TableHead>
                    <TableHead className="text-right">سعر التكلفة</TableHead>
                    <TableHead className="text-right">سعر البيع</TableHead>
                    <TableHead className="text-right">الوحدات</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                        لا توجد منتجات
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.sku || '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{p.barcode || '—'}</TableCell>
                        <TableCell>
                          {p.category ? (
                            <Badge variant="secondary">{p.category.name}</Badge>
                          ) : '—'}
                        </TableCell>
                        <TableCell>{formatNumber(p.costPrice)}</TableCell>
                        <TableCell className="font-semibold text-emerald-600">{formatNumber(p.sellPrice)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {p.units?.map((u: any) => (
                              <Badge key={u.id} variant="outline" className="text-xs">
                                {u.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                            {p.isActive ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                              <Pencil size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(p.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'تعديل منتج' : 'إضافة منتج جديد'}</DialogTitle>
            <DialogDescription>أدخل بيانات المنتج والوحدات المتاحة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم المنتج *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>الباركود</Label>
                <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>سعر التكلفة</Label>
                <Input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>سعر البيع</Label>
                <Input type="number" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>

            {/* Units */}
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">وحدات التعبئة</Label>
                <Button type="button" variant="outline" size="sm" onClick={addUnit}>
                  <PlusCircle size={16} className="ml-1" /> إضافة وحدة
                </Button>
              </div>
              {form.units.map((unit, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">وحدة {idx + 1} {idx === 0 ? '(أساسية)' : ''}</span>
                    {idx > 0 && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeUnit(idx)}>
                        <X size={14} />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">اسم الوحدة *</Label>
                      <Input placeholder="قطعة، كرتونة..." value={unit.name}
                        onChange={(e) => updateUnit(idx, 'name', e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">معامل التحويل</Label>
                      <Input type="number" value={unit.conversionFactor}
                        onChange={(e) => updateUnit(idx, 'conversionFactor', e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">الباركود</Label>
                      <Input value={unit.barcode}
                        onChange={(e) => updateUnit(idx, 'barcode', e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">سعر التكلفة</Label>
                      <Input type="number" value={unit.costPrice}
                        onChange={(e) => updateUnit(idx, 'costPrice', e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">سعر البيع</Label>
                      <Input type="number" value={unit.sellPrice}
                        onChange={(e) => updateUnit(idx, 'sellPrice', e.target.value)} className="h-9" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit}>{editId ? 'تحديث' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Categories Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إدارة التصنيفات</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="اسم التصنيف" value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} />
              <Button onClick={handleAddCategory}>إضافة</Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span>{c.name}</span>
                  <Badge variant="secondary">{c._count?.products || 0} منتج</Badge>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
