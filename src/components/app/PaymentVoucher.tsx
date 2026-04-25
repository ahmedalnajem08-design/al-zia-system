'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { ArrowUpRight, Search, Save, Trash2, Loader2, Wallet } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const methodLabels: Record<string, string> = {
  cash: 'نقدي',
  card: 'بطاقة',
  transfer: 'تحويل',
  cheque: 'شيك',
}

function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '٠'
  return num.toLocaleString('ar-IQ')
}

export default function PaymentVoucher() {
  const { setCurrentPage } = useAppStore()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [supplierId, setSupplierId] = useState('')
  const [supplierQuery, setSupplierQuery] = useState('')
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false)
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const [vouchers, setVouchers] = useState<any[]>([])
  const [loadingVouchers, setLoadingVouchers] = useState(true)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const selectedSupplier = suppliers.find(s => s.id === supplierId)

  // Search suppliers
  const searchSuppliers = useCallback(async (q: string) => {
    if (!q || q.length < 1) { setSuppliers([]); return }
    setLoadingSuppliers(true)
    try {
      const res = await fetch(`/api/suppliers?q=${encodeURIComponent(q)}&limit=20`)
      const data = await res.json()
      setSuppliers(data.suppliers || [])
    } catch { setSuppliers([]) }
    setLoadingSuppliers(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => searchSuppliers(supplierQuery), 300)
    return () => clearTimeout(timer)
  }, [supplierQuery, searchSuppliers])

  // Fetch vouchers
  const fetchVouchers = useCallback(async () => {
    setLoadingVouchers(true)
    try {
      const res = await fetch('/api/vouchers?type=payment&limit=50')
      const data = await res.json()
      setVouchers(data.vouchers || [])
    } catch { setVouchers([]) }
    setLoadingVouchers(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/vouchers?type=payment&limit=50')
      .then(res => res.json())
      .then(data => { if (!cancelled) setVouchers(data.vouchers || []) })
      .catch(() => { if (!cancelled) setVouchers([]) })
      .finally(() => { if (!cancelled) setLoadingVouchers(false) })
    return () => { cancelled = true }
  }, [])

  // Save voucher
  const handleSave = async () => {
    const amountNum = parseFloat(amount)
    if (!supplierId) { toast.error('يرجى اختيار المجهز'); return }
    if (!amountNum || amountNum <= 0) { toast.error('يرجى إدخال مبلغ صحيح'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment',
          supplierId,
          amount: amountNum,
          method,
          description: description || undefined,
          date,
          notes: notes || undefined,
        }),
      })
      if (!res.ok) { const data = await res.json(); toast.error(data.error || 'خطأ'); return }
      toast.success('تم إنشاء سند الدفع بنجاح')
      setSupplierId(''); setSupplierQuery(''); setAmount(''); setDescription(''); setNotes('')
      fetchVouchers()
    } catch { toast.error('حدث خطأ') }
    setSaving(false)
  }

  // Delete voucher
  const handleDelete = async () => {
    if (!deletingId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/vouchers/${deletingId}`, { method: 'DELETE' })
      if (!res.ok) { const data = await res.json(); toast.error(data.error || 'خطأ'); return }
      toast.success('تم حذف السند بنجاح')
      setDeleteDialogOpen(false); setDeletingId(null)
      fetchVouchers()
    } catch { toast.error('حدث خطأ') }
    setDeleting(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')} className="text-gray-500 hover:text-gray-700">
            <ArrowUpRight size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border bg-amber-50 text-amber-700 border-amber-200">
              <Wallet size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">سند دفع</h1>
              <p className="text-sm text-gray-500">تسليم مبالغ للمجهزين</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-700">بيانات سند الدفع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">التاريخ</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-10" />
            </div>

            {/* Supplier */}
            <div className="space-y-2 sm:col-span-2 lg:col-span-2">
              <Label className="text-sm font-medium">المجهز <span className="text-red-500">*</span></Label>
              <div className="relative">
                {selectedSupplier ? (
                  <div className="flex items-center justify-between h-10 px-3 rounded-md border border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{selectedSupplier.name}</span>
                      {selectedSupplier.phone && <span className="text-gray-400">| {selectedSupplier.phone}</span>}
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600"
                      onClick={() => { setSupplierId(''); setSupplierQuery(''); setSupplierDropdownOpen(false) }}>
                      <span className="text-sm">✕</span>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input placeholder="ابحث عن مجهز..." value={supplierQuery}
                        onChange={e => { setSupplierQuery(e.target.value); setSupplierDropdownOpen(true) }}
                        onFocus={() => setSupplierDropdownOpen(true)} className="h-10 pr-9" />
                      {loadingSuppliers && <Loader2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
                    </div>
                    {supplierDropdownOpen && suppliers.length > 0 && (
                      <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {suppliers.map(s => (
                          <button key={s.id} type="button"
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 text-right transition-colors"
                            onClick={() => { setSupplierId(s.id); setSupplierQuery(s.name); setSupplierDropdownOpen(false) }}>
                            <div>
                              <p className="text-sm font-medium">{s.name}</p>
                              {s.phone && <p className="text-xs text-gray-400">{s.phone}</p>}
                            </div>
                            <div className="text-left">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.balance < 0 ? 'bg-red-50 text-red-600' : s.balance > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'}`}>
                                {formatNumber(Math.abs(s.balance))} د.ع {s.balance < 0 ? 'لنا' : s.balance > 0 ? 'عليه' : ''}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">المبلغ <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0" className="h-10 text-left pl-14" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">د.ع</span>
              </div>
            </div>

            {/* Method */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">طريقة الدفع</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(methodLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">الوصف</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف السند..." className="h-10" />
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4 space-y-2">
            <Label className="text-sm font-medium">ملاحظات</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات إضافية..." rows={2} className="resize-none" />
          </div>

          {/* Save */}
          <div className="mt-4 flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              حفظ سند الدفع
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Vouchers */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <Wallet size={18} className="text-amber-600" />
            سندات الدفع الأخيرة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingVouchers ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
          ) : vouchers.length === 0 ? (
            <p className="text-gray-400 text-center py-8">لا توجد سندات دفع</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead>رقم السند</TableHead>
                    <TableHead>المجهز</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الطريقة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead className="text-center">حذف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-sm">{v.voucherNo}</TableCell>
                      <TableCell className="font-medium">{v.supplier?.name || '—'}</TableCell>
                      <TableCell className="font-bold text-amber-700">{formatNumber(v.amount)} د.ع</TableCell>
                      <TableCell><Badge variant="outline">{methodLabels[v.method] || v.method}</Badge></TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(v.date).toLocaleDateString('ar-IQ')}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => { setDeletingId(v.id); setDeleteDialogOpen(true) }}>
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا السند؟ سيتم عكس تأثيره على رصيد المجهز.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? <Loader2 size={16} className="animate-spin" /> : 'نعم، حذف'}
            </AlertDialogAction>
            <AlertDialogCancel disabled={deleting}>تراجع</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
