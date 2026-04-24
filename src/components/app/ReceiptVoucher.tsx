'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { ArrowDownLeft, Search, Save, Trash2, Loader2, Plus, Wallet } from 'lucide-react'

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

export default function ReceiptVoucher() {
  const { setCurrentPage } = useAppStore()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [customerId, setCustomerId] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const [customers, setCustomers] = useState<any[]>([])
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
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

  const selectedCustomer = customers.find(c => c.id === customerId)

  // Search customers
  const searchCustomers = useCallback(async (q: string) => {
    if (!q || q.length < 1) { setCustomers([]); return }
    setLoadingCustomers(true)
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}&limit=20`)
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch { setCustomers([]) }
    setLoadingCustomers(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => searchCustomers(customerQuery), 300)
    return () => clearTimeout(timer)
  }, [customerQuery, searchCustomers])

  // Fetch vouchers
  const fetchVouchers = useCallback(async () => {
    setLoadingVouchers(true)
    try {
      const res = await fetch('/api/vouchers?type=receipt&limit=50')
      const data = await res.json()
      setVouchers(data.vouchers || [])
    } catch { setVouchers([]) }
    setLoadingVouchers(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/vouchers?type=receipt&limit=50')
      .then(res => res.json())
      .then(data => { if (!cancelled) setVouchers(data.vouchers || []) })
      .catch(() => { if (!cancelled) setVouchers([]) })
      .finally(() => { if (!cancelled) setLoadingVouchers(false) })
    return () => { cancelled = true }
  }, [])

  // Save voucher
  const handleSave = async () => {
    const amountNum = parseFloat(amount)
    if (!customerId) { toast.error('يرجى اختيار الزبون'); return }
    if (!amountNum || amountNum <= 0) { toast.error('يرجى إدخال مبلغ صحيح'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'receipt',
          customerId,
          amount: amountNum,
          method,
          description: description || undefined,
          date,
          notes: notes || undefined,
        }),
      })
      if (!res.ok) { const data = await res.json(); toast.error(data.error || 'خطأ'); return }
      toast.success('تم إنشاء سند القبض بنجاح')
      setCustomerId(''); setCustomerQuery(''); setAmount(''); setDescription(''); setNotes('')
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
            <ArrowDownLeft size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">
              <Plus size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">سند قبض</h1>
              <p className="text-sm text-gray-500">تسجيل مبالغ مستلمة من الزبائن</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-700">بيانات سند القبض</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">التاريخ</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-10" />
            </div>

            {/* Customer */}
            <div className="space-y-2 sm:col-span-2 lg:col-span-2">
              <Label className="text-sm font-medium">الزبون <span className="text-red-500">*</span></Label>
              <div className="relative">
                {selectedCustomer ? (
                  <div className="flex items-center justify-between h-10 px-3 rounded-md border border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{selectedCustomer.name}</span>
                      {selectedCustomer.phone && <span className="text-gray-400">| {selectedCustomer.phone}</span>}
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600"
                      onClick={() => { setCustomerId(''); setCustomerQuery(''); setCustomerDropdownOpen(false) }}>
                      <span className="text-sm">✕</span>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input placeholder="ابحث عن زبون..." value={customerQuery}
                        onChange={e => { setCustomerQuery(e.target.value); setCustomerDropdownOpen(true) }}
                        onFocus={() => setCustomerDropdownOpen(true)} className="h-10 pr-9" />
                      {loadingCustomers && <Loader2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
                    </div>
                    {customerDropdownOpen && customers.length > 0 && (
                      <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {customers.map(c => (
                          <button key={c.id} type="button"
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 text-right transition-colors"
                            onClick={() => { setCustomerId(c.id); setCustomerQuery(c.name); setCustomerDropdownOpen(false) }}>
                            <div>
                              <p className="text-sm font-medium">{c.name}</p>
                              {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                            </div>
                            <div className="text-left">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.balance > 0 ? 'bg-red-50 text-red-600' : c.balance < 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'}`}>
                                {formatNumber(Math.abs(c.balance))} د.ع {c.balance > 0 ? 'عليه' : c.balance < 0 ? 'له' : ''}
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
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              حفظ سند القبض
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Vouchers */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <Wallet size={18} className="text-emerald-600" />
            سندات القبض الأخيرة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingVouchers ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
          ) : vouchers.length === 0 ? (
            <p className="text-gray-400 text-center py-8">لا توجد سندات قبض</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead>رقم السند</TableHead>
                    <TableHead>الزبون</TableHead>
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
                      <TableCell className="font-medium">{v.customer?.name || '—'}</TableCell>
                      <TableCell className="font-bold text-emerald-700">{formatNumber(v.amount)} د.ع</TableCell>
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
            <AlertDialogDescription>هل أنت متأكد من حذف هذا السند؟ سيتم عكس تأثيره على رصيد الزبون.</AlertDialogDescription>
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
