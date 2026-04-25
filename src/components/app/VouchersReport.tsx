'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { ArrowRight, FileText, Download, Loader2, Filter } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '٠'
  return num.toLocaleString('ar-IQ')
}

const typeLabels: Record<string, string> = { receipt: 'قبض', payment: 'دفع' }
const typeColors: Record<string, string> = { receipt: 'bg-emerald-100 text-emerald-700', payment: 'bg-amber-100 text-amber-700' }
const methodLabels: Record<string, string> = { cash: 'نقدي', card: 'بطاقة', transfer: 'تحويل', cheque: 'شيك' }

export default function VouchersReport() {
  const { setCurrentPage } = useAppStore()
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVouchers = useCallback(async () => {
    setLoading(true)
    try {
      let url = '/api/vouchers?limit=200'
      if (typeFilter !== 'all') url += `&type=${typeFilter}`
      if (fromDate) url += `&fromDate=${fromDate}`
      if (toDate) url += `&toDate=${toDate}`
      const res = await fetch(url)
      const data = await res.json()
      setVouchers(data.vouchers || [])
    } catch { setVouchers([]) }
    setLoading(false)
  }, [typeFilter, fromDate, toDate])

  useEffect(() => { fetchVouchers() }, [fetchVouchers])

  const totalReceipts = vouchers.filter(v => v.type === 'receipt').reduce((s, v) => s + v.amount, 0)
  const totalPayments = vouchers.filter(v => v.type === 'payment').reduce((s, v) => s + v.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')} className="text-gray-500 hover:text-gray-700">
            <ArrowRight size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border bg-blue-50 text-blue-700 border-blue-200">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">كشف السندات</h1>
              <p className="text-sm text-gray-500">سندات القبض والدفع</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 mb-1">إجمالي سندات القبض</p>
            <p className="text-xl font-bold text-emerald-700">{formatNumber(totalReceipts)} د.ع</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 mb-1">إجمالي سندات الدفع</p>
            <p className="text-xl font-bold text-amber-700">{formatNumber(totalPayments)} د.ع</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 mb-1">صافي السندات</p>
            <p className={`text-xl font-bold ${totalReceipts - totalPayments >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {formatNumber(totalReceipts - totalPayments)} د.ع
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <Filter size={16} /> تصفية السندات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'الكل' },
                { key: 'receipt', label: 'سندات قبض' },
                { key: 'payment', label: 'سندات دفع' },
              ].map(opt => (
                <Button key={opt.key} variant={typeFilter === opt.key ? 'default' : 'outline'} size="sm"
                  onClick={() => setTypeFilter(opt.key)}
                  className={typeFilter === opt.key ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
                  {opt.label}
                </Button>
              ))}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">من تاريخ</Label>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-9 w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">إلى تاريخ</Label>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-9 w-40" />
            </div>
            <Button variant="outline" size="sm" onClick={() => { setTypeFilter('all'); setFromDate(''); setToDate('') }}>
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
          ) : vouchers.length === 0 ? (
            <p className="text-gray-400 text-center py-12">لا توجد سندات</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead>رقم السند</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الطرف</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الطريقة</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-sm">{v.voucherNo}</TableCell>
                      <TableCell><Badge className={typeColors[v.type]}>{typeLabels[v.type]}</Badge></TableCell>
                      <TableCell className="font-medium">{v.customer?.name || v.supplier?.name || '—'}</TableCell>
                      <TableCell className={`font-bold ${v.type === 'receipt' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {formatNumber(v.amount)} د.ع
                      </TableCell>
                      <TableCell><Badge variant="outline">{methodLabels[v.method] || v.method}</Badge></TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(v.date).toLocaleDateString('ar-IQ')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}