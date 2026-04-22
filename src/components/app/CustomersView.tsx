'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Phone,
  Mail,
  MapPin,
  Eye,
  Wallet,
  FileText,
  CreditCard,
  Loader2,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
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

interface CustomerData {
  id: string
  name: string
  phone: string | null
  address: string | null
  email: string | null
  taxNumber: string | null
  notes: string | null
  balance: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { invoices: number; payments: number }
}

interface Transaction {
  date: string
  type: 'debit' | 'credit'
  invoiceNo: string | null
  description: string
  debit: number
  credit: number
  balance: number
}

interface StatementData {
  customer: CustomerData
  transactions: Transaction[]
}

interface FormData {
  name: string
  phone: string
  email: string
  address: string
  taxNumber: string
  notes: string
}

interface PaymentFormData {
  amount: string
  method: string
  date: string
  notes: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const emptyForm: FormData = {
  name: '',
  phone: '',
  email: '',
  address: '',
  taxNumber: '',
  notes: '',
}

const emptyPaymentForm: PaymentFormData = {
  amount: '',
  method: 'cash',
  date: new Date().toISOString().split('T')[0],
  notes: '',
}

function formatNumber(value: number): string {
  return value.toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ar-SA')
}

function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case 'cash':
      return 'نقدي'
    case 'card':
      return 'بطاقة'
    case 'transfer':
      return 'تحويل'
    default:
      return method
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CustomersView() {
  /* ---- State ---- */
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Add / Edit dialog
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [formSaving, setFormSaving] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerData | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Statement dialog
  const [statementDialogOpen, setStatementDialogOpen] = useState(false)
  const [statementData, setStatementData] = useState<StatementData | null>(null)
  const [statementLoading, setStatementLoading] = useState(false)

  // Payment form (inside statement dialog)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>(emptyPaymentForm)
  const [paymentSaving, setPaymentSaving] = useState(false)

  /* ---- Fetch customers ---- */
  const fetchCustomers = useCallback(async (q: string = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      const res = await fetch(`/api/customers?${params.toString()}`)
      if (!res.ok) throw new Error('فشل في جلب البيانات')
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch {
      toast.error('خطأ في جلب الزبائن')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers(debouncedSearch)
  }, [debouncedSearch, fetchCustomers])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  /* ---- Add / Edit ---- */
  function openAddDialog() {
    setEditingCustomer(null)
    setFormData(emptyForm)
    setFormDialogOpen(true)
  }

  function openEditDialog(customer: CustomerData) {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      taxNumber: customer.taxNumber || '',
      notes: customer.notes || '',
    })
    setFormDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error('اسم الزبون مطلوب')
      return
    }
    setFormSaving(true)
    try {
      const isEdit = !!editingCustomer
      const url = isEdit ? `/api/customers/${editingCustomer.id}` : '/api/customers'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'فشل في الحفظ')
      }
      toast.success(isEdit ? 'تم تحديث بيانات الزبون' : 'تم إضافة الزبون بنجاح')
      setFormDialogOpen(false)
      fetchCustomers(debouncedSearch)
    } catch (err: any) {
      toast.error(err.message || 'خطأ في الحفظ')
    } finally {
      setFormSaving(false)
    }
  }

  /* ---- Delete ---- */
  function openDeleteDialog(customer: CustomerData) {
    setDeletingCustomer(customer)
    setDeleteDialogOpen(true)
  }

  async function handleDelete() {
    if (!deletingCustomer) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/customers/${deletingCustomer.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('فشل في الحذف')
      toast.success('تم حذف الزبون بنجاح')
      setDeleteDialogOpen(false)
      fetchCustomers(debouncedSearch)
    } catch {
      toast.error('خطأ في حذف الزبون')
    } finally {
      setDeleting(false)
    }
  }

  /* ---- Account Statement ---- */
  async function openStatement(customer: CustomerData) {
    setStatementData(null)
    setStatementDialogOpen(true)
    setStatementLoading(true)
    setShowPaymentForm(false)
    setPaymentForm(emptyPaymentForm)
    try {
      const res = await fetch(`/api/customers/${customer.id}`)
      if (!res.ok) throw new Error('فشل في جلب كشف الحساب')
      const data = await res.json()
      setStatementData(data)
    } catch {
      toast.error('خطأ في جلب كشف الحساب')
    } finally {
      setStatementLoading(false)
    }
  }

  /* ---- Payment ---- */
  async function handleAddPayment() {
    if (!statementData?.customer?.id) return
    const amount = parseFloat(paymentForm.amount)
    if (!amount || amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح')
      return
    }
    setPaymentSaving(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: statementData.customer.id,
          amount,
          method: paymentForm.method,
          date: paymentForm.date || new Date().toISOString(),
          notes: paymentForm.notes || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'فشل في إضافة الدفعة')
      }
      toast.success('تمت إضافة الدفعة بنجاح')
      setShowPaymentForm(false)
      setPaymentForm(emptyPaymentForm)
      // Refresh statement
      await openStatement(statementData.customer)
      // Refresh list
      fetchCustomers(debouncedSearch)
    } catch (err: any) {
      toast.error(err.message || 'خطأ في إضافة الدفعة')
    } finally {
      setPaymentSaving(false)
    }
  }

  /* ---- Last balance from transactions ---- */
  function getLastBalance(): number {
    if (!statementData?.transactions?.length) return statementData?.customer?.balance || 0
    return statementData.transactions[statementData.transactions.length - 1].balance
  }

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="space-y-6">
      {/* ---- Top Bar ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Users className="text-emerald-600" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">إدارة الزبائن</h2>
            <p className="text-sm text-gray-500">
              {customers.length} زبون مسجل
            </p>
          </div>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
        >
          <Plus size={18} />
          إضافة زبون جديد
        </Button>
      </div>

      {/* ---- Search ---- */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="بحث بالاسم أو الهاتف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10 bg-white border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
        />
      </div>

      {/* ---- Cards Grid ---- */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-600" size={36} />
        </div>
      ) : customers.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 bg-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="text-gray-300 mb-4" size={56} />
            <p className="text-gray-500 text-lg font-medium">
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا يوجد زبائن بعد'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {searchQuery ? 'حاول تغيير كلمات البحث' : 'اضغط على الزر أعلاه لإضافة زبون جديد'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <Card
              key={customer.id}
              className="bg-white hover:shadow-md transition-shadow duration-200 border-gray-100"
            >
              <CardContent className="p-5">
                {/* Name + Balance */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-700 font-bold text-sm">
                        {customer.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-base truncate">
                      {customer.name}
                    </h3>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`flex-shrink-0 font-bold text-xs px-2.5 py-1 ${
                      customer.balance > 0
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : customer.balance < 0
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-gray-50 text-gray-500 border border-gray-200'
                    }`}
                  >
                    <Wallet size={12} className="ml-1" />
                    {formatNumber(Math.abs(customer.balance))} ر.س
                  </Badge>
                </div>

                {/* Info rows */}
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{customer.phone}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                  )}
                  {customer.taxNumber && (
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">الرقم الضريبي: {customer.taxNumber}</span>
                    </div>
                  )}
                </div>

                {/* Balance label */}
                <div className="mb-4 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gray-50 text-center">
                  {customer.balance > 0
                    ? `عليه: ${formatNumber(customer.balance)} ر.س`
                    : customer.balance < 0
                    ? `له: ${formatNumber(Math.abs(customer.balance))} ر.س`
                    : 'لا يوجد رصيد'}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs h-8 text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                    onClick={() => openStatement(customer)}
                  >
                    <Eye size={13} />
                    عرض كشف الحساب
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8 text-gray-600 hover:bg-gray-50"
                    onClick={() => openEditDialog(customer)}
                  >
                    <Edit size={13} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => openDeleteDialog(customer)}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/*  Add / Edit Dialog                                            */}
      {/* ============================================================ */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingCustomer ? 'تعديل بيانات الزبون' : 'إضافة زبون جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* الاسم */}
            <div className="grid gap-2">
              <Label htmlFor="c-name">
                الاسم <span className="text-red-500">*</span>
              </Label>
              <Input
                id="c-name"
                placeholder="اسم الزبون"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            {/* الهاتف */}
            <div className="grid gap-2">
              <Label htmlFor="c-phone">الهاتف</Label>
              <Input
                id="c-phone"
                placeholder="رقم الهاتف"
                value={formData.phone}
                onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            {/* البريد الإلكتروني */}
            <div className="grid gap-2">
              <Label htmlFor="c-email">البريد الإلكتروني</Label>
              <Input
                id="c-email"
                type="email"
                placeholder="البريد الإلكتروني"
                value={formData.email}
                onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            {/* العنوان */}
            <div className="grid gap-2">
              <Label htmlFor="c-address">العنوان</Label>
              <Input
                id="c-address"
                placeholder="العنوان"
                value={formData.address}
                onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            {/* الرقم الضريبي */}
            <div className="grid gap-2">
              <Label htmlFor="c-tax">الرقم الضريبي</Label>
              <Input
                id="c-tax"
                placeholder="الرقم الضريبي"
                value={formData.taxNumber}
                onChange={(e) => setFormData((f) => ({ ...f, taxNumber: e.target.value }))}
              />
            </div>
            {/* ملاحظات */}
            <div className="grid gap-2">
              <Label htmlFor="c-notes">ملاحظات</Label>
              <Textarea
                id="c-notes"
                placeholder="ملاحظات إضافية"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setFormDialogOpen(false)}
              disabled={formSaving}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={formSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {formSaving && <Loader2 size={16} className="animate-spin ml-2" />}
              {editingCustomer ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/*  Delete Confirmation Dialog                                   */}
      {/* ============================================================ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              هل أنت متأكد من حذف الزبون &quot;{deletingCustomer?.name}&quot;؟ لا يمكن التراجع عن هذا
              الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 size={16} className="animate-spin ml-2" />}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================================ */}
      {/*  Account Statement Dialog                                     */}
      {/* ============================================================ */}
      <Dialog open={statementDialogOpen} onOpenChange={setStatementDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileText size={20} className="text-emerald-600" />
              كشف حساب الزبون
            </DialogTitle>
          </DialogHeader>

          {statementLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-emerald-600" size={36} />
            </div>
          ) : statementData ? (
            <div className="space-y-4">
              {/* Customer info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {statementData.customer.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      {statementData.customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={13} /> {statementData.customer.phone}
                        </span>
                      )}
                      {statementData.customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={13} /> {statementData.customer.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500 mb-1">الرصيد الحالي</p>
                    <p
                      className={`text-2xl font-bold ${
                        getLastBalance() > 0
                          ? 'text-red-600'
                          : getLastBalance() < 0
                          ? 'text-emerald-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {formatNumber(Math.abs(getLastBalance()))} ر.س
                    </p>
                  </div>
                </div>
              </div>

              {/* Add Payment button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <CreditCard size={15} />
                  إضافة دفعة
                </Button>
              </div>

              {/* Payment form */}
              {showPaymentForm && (
                <Card className="border-emerald-200 bg-emerald-50/40">
                  <CardContent className="p-4">
                    <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Wallet size={16} className="text-emerald-600" />
                      إضافة دفعة جديدة
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="grid gap-1.5">
                        <Label className="text-xs text-gray-600">المبلغ</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={paymentForm.amount}
                          onChange={(e) =>
                            setPaymentForm((f) => ({ ...f, amount: e.target.value }))
                          }
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs text-gray-600">طريقة الدفع</Label>
                        <Select
                          value={paymentForm.method}
                          onValueChange={(v) => setPaymentForm((f) => ({ ...f, method: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">نقدي</SelectItem>
                            <SelectItem value="card">بطاقة</SelectItem>
                            <SelectItem value="transfer">تحويل</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs text-gray-600">التاريخ</Label>
                        <Input
                          type="date"
                          value={paymentForm.date}
                          onChange={(e) =>
                            setPaymentForm((f) => ({ ...f, date: e.target.value }))
                          }
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs text-gray-600">ملاحظات</Label>
                        <Input
                          placeholder="ملاحظات"
                          value={paymentForm.notes}
                          onChange={(e) =>
                            setPaymentForm((f) => ({ ...f, notes: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPaymentForm(false)}
                        disabled={paymentSaving}
                      >
                        إلغاء
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddPayment}
                        disabled={paymentSaving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {paymentSaving && <Loader2 size={14} className="animate-spin ml-1" />}
                        حفظ الدفعة
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transactions Table */}
              {statementData.transactions.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <FileText size={40} className="mx-auto mb-2 opacity-40" />
                  <p>لا توجد حركات على هذا الحساب</p>
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden">
                  <div className="max-h-[350px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="text-gray-600 font-semibold text-xs">التاريخ</TableHead>
                          <TableHead className="text-gray-600 font-semibold text-xs">رقم الفاتورة</TableHead>
                          <TableHead className="text-gray-600 font-semibold text-xs">البيان</TableHead>
                          <TableHead className="text-gray-600 font-semibold text-xs text-center">مبلغ (مدين)</TableHead>
                          <TableHead className="text-gray-600 font-semibold text-xs text-center">مبلغ (دائن)</TableHead>
                          <TableHead className="text-gray-600 font-semibold text-xs text-center">الرصيد</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statementData.transactions.map((txn, idx) => (
                          <TableRow key={idx} className="text-sm">
                            <TableCell className="text-gray-700 text-xs whitespace-nowrap">
                              {formatDate(txn.date)}
                            </TableCell>
                            <TableCell className="text-gray-700 text-xs whitespace-nowrap font-mono">
                              {txn.invoiceNo || '—'}
                            </TableCell>
                            <TableCell className="text-gray-700 text-xs">
                              {txn.description}
                            </TableCell>
                            <TableCell className="text-center text-xs">
                              {txn.debit > 0 ? (
                                <span className="text-red-600 font-medium">
                                  {formatNumber(txn.debit)}
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-xs">
                              {txn.credit > 0 ? (
                                <span className="text-emerald-600 font-medium">
                                  {formatNumber(txn.credit)}
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </TableCell>
                            <TableCell
                              className={`text-center text-xs font-bold ${
                                txn.balance > 0
                                  ? 'text-red-600'
                                  : txn.balance < 0
                                  ? 'text-emerald-600'
                                  : 'text-gray-500'
                              }`}
                            >
                              {formatNumber(Math.abs(txn.balance))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
