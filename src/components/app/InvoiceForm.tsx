'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { InvoiceType } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Trash2,
  Search,
  ArrowRight,
  Save,
  CheckCircle,
  ShoppingCart,
  Truck,
  RotateCcw,
  Undo2,
  Loader2,
  X,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface InvoiceFormProps {
  type: InvoiceType
}

interface InvoiceItemRow {
  id: string // unique key for React
  productId: string
  unitId: string
  productName: string
  unitName: string
  quantity: number
  price: number
  total: number
  costPrice: number
  _productData: any | null
  _unitData: any | null
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const labels: Record<InvoiceType, string> = {
  sale: 'فاتورة بيع',
  purchase: 'فاتورة شراء',
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

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('ar-IQ').format(Math.round(n))
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function InvoiceForm({ type }: InvoiceFormProps) {
  const { setCurrentPage, setSelectedInvoiceId } = useAppStore()
  const Icon = typeIcons[type]

  /* ---- Form state ---- */
  const [date, setDate] = useState(todayStr())
  const [warehouseId, setWarehouseId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<InvoiceItemRow[]>([])
  const [saving, setSaving] = useState(false)

  /* ---- Data caches ---- */
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])

  /* ---- Search states ---- */
  const [customerQuery, setCustomerQuery] = useState('')
  const [supplierQuery, setSupplierQuery] = useState('')
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false)

  /* ---- Product search state per row (tracked by row id) ---- */
  const [productSearch, setProductSearch] = useState<Record<string, string>>({})
  const [productResults, setProductResults] = useState<Record<string, any[]>>({})
  const [productDropdownOpen, setProductDropdownOpen] = useState<Record<string, boolean>>({})
  const productSearchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  /* ---- Loading states ---- */
  const [loadingWarehouses, setLoadingWarehouses] = useState(true)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)

  const isCustomerType = type === 'sale' || type === 'sale_return'
  const isSupplierType = type === 'purchase' || type === 'purchase_return'
  const isSaleType = type === 'sale' || type === 'sale_return'

  /* ================================================================ */
  /*  Fetch warehouses on mount                                        */
  /* ================================================================ */
  useEffect(() => {
    fetch('/api/warehouses')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setWarehouses(list)
        setLoadingWarehouses(false)
      })
      .catch(() => setLoadingWarehouses(false))
  }, [])

  /* ================================================================ */
  /*  Customer search                                                  */
  /* ================================================================ */
  const searchCustomers = useCallback(async (q: string) => {
    if (!q || q.length < 1) {
      setCustomers([])
      return
    }
    setLoadingCustomers(true)
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}&limit=20`)
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch {
      setCustomers([])
    }
    setLoadingCustomers(false)
  }, [])

  useEffect(() => {
    if (!isCustomerType) return
    const timer = setTimeout(() => searchCustomers(customerQuery), 300)
    return () => clearTimeout(timer)
  }, [customerQuery, isCustomerType, searchCustomers])

  /* ================================================================ */
  /*  Supplier search                                                  */
  /* ================================================================ */
  const searchSuppliers = useCallback(async (q: string) => {
    if (!q || q.length < 1) {
      setSuppliers([])
      return
    }
    setLoadingSuppliers(true)
    try {
      const res = await fetch(`/api/suppliers?q=${encodeURIComponent(q)}&limit=20`)
      const data = await res.json()
      setSuppliers(data.suppliers || [])
    } catch {
      setSuppliers([])
    }
    setLoadingSuppliers(false)
  }, [])

  useEffect(() => {
    if (!isSupplierType) return
    const timer = setTimeout(() => searchSuppliers(supplierQuery), 300)
    return () => clearTimeout(timer)
  }, [supplierQuery, isSupplierType, searchSuppliers])

  /* ================================================================ */
  /*  Product search per row                                           */
  /* ================================================================ */
  const handleProductSearch = useCallback((rowId: string, q: string) => {
    setProductSearch((prev) => ({ ...prev, [rowId]: q }))
    setProductDropdownOpen((prev) => ({ ...prev, [rowId]: true }))

    if (productSearchTimers.current[rowId]) {
      clearTimeout(productSearchTimers.current[rowId])
    }

    if (!q || q.length < 1) {
      setProductResults((prev) => ({ ...prev, [rowId]: [] }))
      return
    }

    productSearchTimers.current[rowId] = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&limit=20`)
        const data = await res.json()
        setProductResults((prev) => ({ ...prev, [rowId]: data.products || [] }))
      } catch {
        setProductResults((prev) => ({ ...prev, [rowId]: [] }))
      }
    }, 300)
  }, [])

  /* ================================================================ */
  /*  Item management                                                  */
  /* ================================================================ */
  const addItem = () => {
    const newRow: InvoiceItemRow = {
      id: uid(),
      productId: '',
      unitId: '',
      productName: '',
      unitName: '',
      quantity: 1,
      price: 0,
      total: 0,
      costPrice: 0,
      _productData: null,
      _unitData: null,
    }
    setItems((prev) => [...prev, newRow])
  }

  const removeItem = (rowId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== rowId))
    // Cleanup search state
    setProductSearch((prev) => {
      const next = { ...prev }
      delete next[rowId]
      return next
    })
    setProductResults((prev) => {
      const next = { ...prev }
      delete next[rowId]
      return next
    })
    setProductDropdownOpen((prev) => {
      const next = { ...prev }
      delete next[rowId]
      return next
    })
  }

  const updateItem = (rowId: string, updates: Partial<InvoiceItemRow>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item
        const updated = { ...item, ...updates }
        // Recalculate total
        updated.total = updated.quantity * updated.price
        return updated
      })
    )
  }

  const selectProduct = (rowId: string, product: any) => {
    // Determine price based on invoice type
    const hasUnits = product.units && product.units.length > 0
    const defaultUnit = hasUnits ? product.units.find((u: any) => u.isDefault) || product.units[0] : null
    const price = defaultUnit
      ? isSaleType
        ? (defaultUnit.sellPrice || product.sellPrice || 0)
        : (defaultUnit.costPrice || product.costPrice || 0)
      : isSaleType
        ? (product.sellPrice || 0)
        : (product.costPrice || 0)

    const costPrice = defaultUnit
      ? (defaultUnit.costPrice || product.costPrice || 0)
      : (product.costPrice || 0)

    updateItem(rowId, {
      productId: product.id,
      productName: product.name,
      unitId: defaultUnit?.id || '',
      unitName: defaultUnit?.name || '',
      quantity: 1,
      price,
      costPrice,
      _productData: product,
      _unitData: defaultUnit || null,
    })

    // Close dropdown and clear search
    setProductSearch((prev) => ({ ...prev, [rowId]: product.name }))
    setProductDropdownOpen((prev) => ({ ...prev, [rowId]: false }))
    setProductResults((prev) => ({ ...prev, [rowId]: [] }))
  }

  const selectUnit = (rowId: string, unit: any) => {
    const productData = items.find((i) => i.id === rowId)?._productData
    const price = isSaleType
      ? (unit.sellPrice || productData?.sellPrice || 0)
      : (unit.costPrice || productData?.costPrice || 0)
    const costPrice = unit.costPrice || productData?.costPrice || 0

    updateItem(rowId, {
      unitId: unit.id,
      unitName: unit.name,
      price,
      costPrice,
      _unitData: unit,
    })
  }

  /* ================================================================ */
  /*  Calculations                                                     */
  /* ================================================================ */
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const totalAmount = subtotal - discount + tax
  const remaining = totalAmount - paidAmount

  /* ================================================================ */
  /*  Save handler                                                     */
  /* ================================================================ */
  const handleSave = async (status: 'draft' | 'confirmed') => {
    // Validation
    if (!warehouseId) {
      toast.error('يرجى اختيار المخزن')
      return
    }
    if (items.length === 0) {
      toast.error('يرجى إضافة مادة واحدة على الأقل')
      return
    }
    const validItems = items.filter((i) => i.productId)
    if (validItems.length === 0) {
      toast.error('يرجى اختيار مادة صالحة واحدة على الأقل')
      return
    }

    setSaving(true)
    try {
      const body = {
        type,
        customerId: isCustomerType ? customerId || null : null,
        supplierId: isSupplierType ? supplierId || null : null,
        warehouseId,
        date,
        subtotal,
        discount,
        tax,
        total: totalAmount,
        paidAmount,
        notes,
        status,
        items: validItems.map((item) => ({
          productId: item.productId,
          unitId: item.unitId || null,
          productName: item.productName,
          unitName: item.unitName || null,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          costPrice: item.costPrice,
        })),
      }

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'حدث خطأ أثناء الحفظ')
        return
      }

      toast.success(
        status === 'draft'
          ? 'تم حفظ الفاتورة كمسودة بنجاح'
          : 'تم تأكيد وحفظ الفاتورة بنجاح'
      )

      // Navigate to invoice detail
      setSelectedInvoiceId(data.id)
      setCurrentPage('invoice_detail')
    } catch {
      toast.error('حدث خطأ أثناء الحفظ')
    }
    setSaving(false)
  }

  /* ================================================================ */
  /*  Selected customer/supplier display                               */
  /* ================================================================ */
  const selectedCustomer = isCustomerType && customerId
    ? customers.find((c) => c.id === customerId)
    : null
  const selectedSupplier = isSupplierType && supplierId
    ? suppliers.find((s) => s.id === supplierId)
    : null

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <div className={`p-2.5 rounded-xl border ${typeColors[type]}`}>
              <Icon size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">{labels[type]}</h1>
              <p className="text-sm text-gray-500">إنشاء فاتورة جديدة</p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-sm font-medium">
          جديد
        </Badge>
      </div>

      {/* Top form fields */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-700">معلومات الفاتورة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Invoice Type (read-only) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">نوع الفاتورة</Label>
              <div className="flex h-10 items-center px-3 rounded-md border border-gray-200 bg-gray-50 text-sm">
                <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium ${typeColors[type]}`}>
                  <Icon size={14} />
                  {labels[type]}
                </span>
              </div>
            </div>

            {/* Invoice Number (read-only placeholder) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">رقم الفاتورة</Label>
              <div className="flex h-10 items-center px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-400">
                سيتم إنشاؤه تلقائياً
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">التاريخ</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Warehouse */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">المخزن</Label>
              {loadingWarehouses ? (
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-gray-200 text-sm text-gray-400">
                  <Loader2 size={16} className="animate-spin" />
                  جاري التحميل...
                </div>
              ) : (
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="اختر المخزن" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Customer / Supplier */}
            {isCustomerType && (
              <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                <Label className="text-sm font-medium">الزبون</Label>
                <div className="relative">
                  {selectedCustomer ? (
                    <div className="flex items-center justify-between h-10 px-3 rounded-md border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{selectedCustomer.name}</span>
                        {selectedCustomer.phone && (
                          <span className="text-gray-400">| {selectedCustomer.phone}</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          setCustomerId('')
                          setCustomerQuery('')
                          setCustomerDropdownOpen(false)
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search
                          size={16}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <Input
                          placeholder="ابحث عن زبون (الاسم أو الهاتف)..."
                          value={customerQuery}
                          onChange={(e) => {
                            setCustomerQuery(e.target.value)
                            setCustomerDropdownOpen(true)
                          }}
                          onFocus={() => setCustomerDropdownOpen(true)}
                          className="h-10 pr-9"
                        />
                        {loadingCustomers && (
                          <Loader2
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
                          />
                        )}
                      </div>
                      {customerDropdownOpen && customers.length > 0 && (
                        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {customers.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 text-right transition-colors"
                              onClick={() => {
                                setCustomerId(c.id)
                                setCustomerQuery(c.name)
                                setCustomerDropdownOpen(false)
                              }}
                            >
                              <div>
                                <p className="text-sm font-medium">{c.name}</p>
                                {c.phone && (
                                  <p className="text-xs text-gray-400">{c.phone}</p>
                                )}
                              </div>
                              {c.balance !== 0 && (
                                <span
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    c.balance > 0
                                      ? 'bg-red-50 text-red-600'
                                      : 'bg-emerald-50 text-emerald-600'
                                  }`}
                                >
                                  {formatNumber(Math.abs(c.balance))} د.ع
                                  {c.balance > 0 ? ' عليه' : ' له'}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {isSupplierType && (
              <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                <Label className="text-sm font-medium">المجهز</Label>
                <div className="relative">
                  {selectedSupplier ? (
                    <div className="flex items-center justify-between h-10 px-3 rounded-md border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{selectedSupplier.name}</span>
                        {selectedSupplier.phone && (
                          <span className="text-gray-400">| {selectedSupplier.phone}</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          setSupplierId('')
                          setSupplierQuery('')
                          setSupplierDropdownOpen(false)
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search
                          size={16}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <Input
                          placeholder="ابحث عن مجهز (الاسم أو الهاتف)..."
                          value={supplierQuery}
                          onChange={(e) => {
                            setSupplierQuery(e.target.value)
                            setSupplierDropdownOpen(true)
                          }}
                          onFocus={() => setSupplierDropdownOpen(true)}
                          className="h-10 pr-9"
                        />
                        {loadingSuppliers && (
                          <Loader2
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
                          />
                        )}
                      </div>
                      {supplierDropdownOpen && suppliers.length > 0 && (
                        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {suppliers.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 text-right transition-colors"
                              onClick={() => {
                                setSupplierId(s.id)
                                setSupplierQuery(s.name)
                                setSupplierDropdownOpen(false)
                              }}
                            >
                              <div>
                                <p className="text-sm font-medium">{s.name}</p>
                                {s.phone && (
                                  <p className="text-xs text-gray-400">{s.phone}</p>
                                )}
                              </div>
                              {s.balance !== 0 && (
                                <span
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    s.balance > 0
                                      ? 'bg-amber-50 text-amber-600'
                                      : 'bg-emerald-50 text-emerald-600'
                                  }`}
                                >
                                  {formatNumber(Math.abs(s.balance))} د.ع
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Items Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700">مواد الفاتورة</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <Plus size={16} />
              إضافة مادة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <ShoppingCart size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm mb-4">لم تتم إضافة مواد بعد</p>
              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <Plus size={16} />
                إضافة مادة
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="w-[40px] text-center">#</TableHead>
                    <TableHead className="min-w-[200px]">المادة</TableHead>
                    <TableHead className="min-w-[140px]">الوحدة</TableHead>
                    <TableHead className="min-w-[100px]">الكمية</TableHead>
                    <TableHead className="min-w-[110px]">السعر</TableHead>
                    <TableHead className="min-w-[110px]">الإجمالي</TableHead>
                    <TableHead className="w-[50px] text-center">حذف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id} className="align-top">
                      {/* Row number */}
                      <TableCell className="text-center text-sm text-gray-400 font-medium">
                        {index + 1}
                      </TableCell>

                      {/* Product search */}
                      <TableCell className="relative">
                        {item.productId ? (
                          <div className="flex items-center gap-2 h-10">
                            <span className="text-sm font-medium truncate">{item.productName}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 flex-shrink-0 text-gray-400 hover:text-gray-600"
                              onClick={() => {
                                updateItem(item.id, {
                                  productId: '',
                                  productName: '',
                                  unitId: '',
                                  unitName: '',
                                  quantity: 1,
                                  price: 0,
                                  total: 0,
                                  costPrice: 0,
                                  _productData: null,
                                  _unitData: null,
                                })
                                setProductSearch((prev) => ({ ...prev, [item.id]: '' }))
                              }}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ) : (
                          <div className="relative">
                            <Search
                              size={16}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <Input
                              placeholder="ابحث عن مادة..."
                              value={productSearch[item.id] || ''}
                              onChange={(e) => handleProductSearch(item.id, e.target.value)}
                              onFocus={() => setProductDropdownOpen((prev) => ({ ...prev, [item.id]: true }))}
                              className="h-10 text-sm pr-8"
                            />
                            {productDropdownOpen[item.id] &&
                              productResults[item.id]?.length > 0 && (
                                <div className="absolute z-50 top-full mt-1 w-full min-w-[260px] bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                                  {productResults[item.id].map((p: any) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 text-right transition-colors"
                                      onClick={() => selectProduct(item.id, p)}
                                    >
                                      <div>
                                        <p className="text-sm font-medium">{p.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                          {p.sku && <span>{p.sku}</span>}
                                          <span>المخزون: {formatNumber(p.totalStock || 0)}</span>
                                        </div>
                                      </div>
                                      <span className="text-xs font-medium text-emerald-600">
                                        {formatNumber(isSaleType ? p.sellPrice : p.costPrice)} د.ع
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                          </div>
                        )}
                      </TableCell>

                      {/* Unit select */}
                      <TableCell>
                        {item._productData?.units?.length ? (
                          <Select
                            value={item.unitId}
                            onValueChange={(val) => {
                              const unit = item._productData.units.find(
                                (u: any) => u.id === val
                              )
                              if (unit) selectUnit(item.id, unit)
                            }}
                          >
                            <SelectTrigger className="h-10 text-sm">
                              <SelectValue placeholder="اختر الوحدة" />
                            </SelectTrigger>
                            <SelectContent>
                              {item._productData.units.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>
                                  <span className="flex items-center gap-2">
                                    {u.name}
                                    {u.conversionFactor > 1 && (
                                      <span className="text-xs text-gray-400">
                                        (×{u.conversionFactor})
                                      </span>
                                    )}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="h-10 flex items-center px-3 text-sm text-gray-400 border border-gray-200 rounded-md bg-gray-50">
                            {item.unitName || 'قطعة'}
                          </div>
                        )}
                      </TableCell>

                      {/* Quantity */}
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={item.quantity || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            updateItem(item.id, { quantity: val })
                          }}
                          className="h-10 text-sm text-left"
                          disabled={!item.productId}
                        />
                      </TableCell>

                      {/* Price */}
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            updateItem(item.id, { price: val })
                          }}
                          className="h-10 text-sm text-left"
                          disabled={!item.productId}
                        />
                      </TableCell>

                      {/* Total */}
                      <TableCell>
                        <div className="h-10 flex items-center px-3 text-sm font-medium bg-gray-50 rounded-md border border-gray-200">
                          {formatNumber(item.total)} د.ع
                        </div>
                      </TableCell>

                      {/* Delete */}
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 size={16} />
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

      {/* Totals + Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-700">ملاحظات</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="أضف ملاحظات على الفاتورة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Totals */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-700">حساب الفاتورة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Subtotal */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">المجموع الفرعي</span>
                <span className="text-sm font-semibold">{formatNumber(subtotal)} د.ع</span>
              </div>

              {/* Discount */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">الخصم</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount || ''}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="h-8 w-28 text-sm text-left"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-400">د.ع</span>
                </div>
              </div>

              {/* Tax */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">الضريبة</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tax || ''}
                    onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                    className="h-8 w-28 text-sm text-left"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-400">د.ع</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between py-3 bg-gray-50 rounded-lg px-3 -mx-3">
                <span className="text-base font-bold text-gray-800">الإجمالي</span>
                <span className="text-base font-bold text-gray-800">{formatNumber(totalAmount)} د.ع</span>
              </div>

              {/* Paid Amount */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">المبلغ المدفوع</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="h-8 w-28 text-sm text-left"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-400">د.ع</span>
                </div>
              </div>

              {/* Remaining */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">المبلغ المتبقي</span>
                <span
                  className={`text-sm font-bold ${
                    remaining > 0
                      ? 'text-amber-600'
                      : remaining < 0
                        ? 'text-red-600'
                        : 'text-emerald-600'
                  }`}
                >
                  {formatNumber(Math.abs(remaining))} د.ع
                  {remaining > 0 && ' + '}
                  {remaining < 0 && ' - '}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pb-4">
        <Button
          type="button"
          variant="outline"
          className="gap-2 h-11"
          disabled={saving}
          onClick={() => handleSave('draft')}
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          حفظ كمسودة
        </Button>
        <Button
          type="button"
          className="gap-2 h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={saving}
          onClick={() => handleSave('confirmed')}
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <CheckCircle size={18} />
          )}
          تأكيد وحفظ
        </Button>
      </div>
    </div>
  )
}
