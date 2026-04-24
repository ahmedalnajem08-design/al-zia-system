'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { ArrowUpRight, Save, Trash2, Loader2, Receipt, X } from 'lucide-react'

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

const categories = ['إيجار', 'مرافق', 'رواتب', 'صيانة', 'نقل', 'أخرى']

const categoryColors: Record<string, string> = {
  'إيجار': 'bg-blue-100 text-blue-700',
  'مرافق': 'bg-yellow-100 text-yellow-700',
  'رواتب': 'bg-purple-100 text-purple-700',
  'صيانة': 'bg-orange-100 text-orange-700',
  'نقل': 'bg-teal-100 text-teal-700',
  'أخرى': 'bg-gray-100 text-gray-700',
}

function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '٠'
  return num.toLocaleString('ar-IQ')
}

export default function ExpenseVoucher() {
  const { setCurrentPage } = useAppStore()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('أخرى')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/expenses?limit=50')
      const data = await res.json()
      setExpenses(data.expenses || [])
    } catch { setExpenses([]) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const handleSave = async () => {
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0) { toast.error('يرجى إدخال مبلغ صحيح'); return }
    if (!description.trim()) { toast.error('يرجى إدخال وصف المصروف'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountNum, category, description, date, notes: notes || undefined }),
      })
      if (!res.ok) { const data = await res.json(); toast.error(data.error || 'خطأ'); return }
      toast.success('تم تسجيل سند الصرف بنجاح')
      setAmount(''); setDescription(''); setNotes('')
      fetchExpenses()
    } catch { toast.error('حدث خطأ') }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/expenses/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('خطأ في الحذف'); return }
      toast.success('تم حذف سند الصرف')
      setDeleteOpen(false); setDeleteId(null); fetchExpenses()
    } catch { toast.error('حدث خطأ') }
    setDeleting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border bg-orange-50 text-orange-700 border-orange-200">
              <Receipt size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">سند صرف</h1>
              <p className="text-sm text-gray-500">تسجيل مصروفات عامة</p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-700">بيانات سند الصرف</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">التاريخ</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">المبلغ <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="h-10 text-left pl-14" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">د.ع</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">التصنيف</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label className="text-sm font-medium">الوصف <span className="text-red-500">*</span></Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف المصروف..." className="h-10" />
          </div>
          <div className="mt-4 space-y-2">
            <Label className="text-sm font-medium">ملاحظات</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات إضافية..." rows={2} className="resize-none" />
          </div>
          <div className="mt-4">
            <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              تسجيل سند الصرف
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-700">سندات الصرف الأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
          ) : expenses.length === 0 ? (
            <p className="text-gray-400 text-center py-8">لا توجد سندات صرف</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead>رقم السند</TableHead>
                    <TableHead>التصنيف</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead className="text-center">حذف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-sm">{e.expenseNo}</TableCell>
                      <TableCell><Badge className={categoryColors[e.category] || 'bg-gray-100 text-gray-700'}>{e.category}</Badge></TableCell>
                      <TableCell className="text-sm">{e.description}</TableCell>
                      <TableCell className="font-bold text-orange-700">{formatNumber(e.amount)} د.ع</TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(e.date).toLocaleDateString('ar-IQ')}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => { setDeleteId(e.id); setDeleteOpen(true) }}>
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف سند الصرف هذا؟</AlertDialogDescription>
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