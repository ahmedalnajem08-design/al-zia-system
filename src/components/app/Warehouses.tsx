'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, Warehouse } from 'lucide-react'

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', address: '', phone: '', notes: '' })

  const fetchData = useCallback(() => {
    fetch('/api/warehouses')
      .then(r => r.json())
      .then(data => { setWarehouses(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('اسم المخزن مطلوب'); return }
    try {
      if (editId) {
        const res = await fetch(`/api/warehouses/${editId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
        })
        if (res.ok) toast.success('تم تحديث المخزن')
        else { const e = await res.json(); toast.error(e.error) }
      } else {
        const res = await fetch('/api/warehouses', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
        })
        if (res.ok) toast.success('تم إنشاء المخزن')
        else { const e = await res.json(); toast.error(e.error) }
      }
      setDialogOpen(false); setEditId(null); setForm({ name: '', address: '', phone: '', notes: '' }); fetchData()
    } catch { toast.error('خطأ في الحفظ') }
  }

  const handleEdit = (w: any) => {
    setEditId(w.id)
    setForm({ name: w.name, address: w.address || '', phone: w.phone || '', notes: w.notes || '' })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد؟')) return
    const res = await fetch(`/api/warehouses/${id}`, { method: 'DELETE' })
    if (res.ok) toast.success('تم حذف المخزن')
    else toast.error('خطأ في الحذف')
    fetchData()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-500">
          <Warehouse size={20} />
          <span>{warehouses.length} مخزن</span>
        </div>
        <Button onClick={() => { setEditId(null); setForm({ name: '', address: '', phone: '', notes: '' }); setDialogOpen(true) }}>
          <Plus size={16} className="ml-1" /> إضافة مخزن
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-6 h-32" /></Card>
          ))
        ) : warehouses.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">لا توجد مخازن</div>
        ) : (
          warehouses.map((w: any) => (
            <Card key={w.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Warehouse size={18} className="text-emerald-600" />
                      <h3 className="font-bold">{w.name}</h3>
                      <Badge className={w.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                        {w.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                    {w.address && <p className="text-sm text-gray-500">{w.address}</p>}
                    {w.phone && <p className="text-sm text-gray-500">{w.phone}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(w)}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(w.id)}><Trash2 size={16} /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'تعديل مخزن' : 'إضافة مخزن'}</DialogTitle>
            <DialogDescription>أدخل بيانات المخزن</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>الاسم *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>العنوان</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="space-y-2"><Label>الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit}>{editId ? 'تحديث' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
