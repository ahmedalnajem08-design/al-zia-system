'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { ArrowRight, Receipt, Loader2, Filter, PieChart } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '٠'
  return num.toLocaleString('ar-IQ')
}

const categoryColors: Record<string, string> = {
  'إيجار': 'bg-blue-100 text-blue-700',
  'مرافق': 'bg-yellow-100 text-yellow-700',
  'رواتب': 'bg-purple-100 text-purple-700',
  'صيانة': 'bg-orange-100 text-orange-700',
  'نقل': 'bg-teal-100 text-teal-700',
  'أخرى': 'bg-gray-100 text-gray-700',
}

const allCategories = ['إيجار', 'مرافق', 'رواتب', 'صيانة', 'نقل', 'أخرى']

export default function ExpensesReport() {
  const { setCurrentPage } = useAppStore()
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [expenses, setExpenses] = useState<any[]>([])
  const [categorySummary, setCategorySummary] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      let url = '/api/expenses?limit=200'
      if (fromDate) url += `&fromDate=${fromDate}`
      if (toDate) url += `&toDate=${toDate}`
      if (categoryFilter !== 'all') url += `&category=${categoryFilter}`
      const res = await fetch(url)
      const data = await res.json()
      setExpenses(data.expenses || [])
      setCategorySummary(data.categorySummary || [])
    } catch { setExpenses([]); setCategorySummary([]) }
    setLoading(false)
  }, [fromDate, toDate, categoryFilter])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')} className="text-gray-500 hover:text-gray-700">
          <ArrowRight size={20} />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl border bg-red-50 text-red-700 border-red-200">
            <PieChart size={22} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">كشف المصروفات</h1>
            <p className="text-sm text-gray-500">تقرير المصروفات العامة</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg font-semibold text-gray-700">إجمالي المصروفات</p>
            <p className="text-2xl font-bold text-red-700">{formatNumber(totalExpenses)} د.ع</p>
          </div>
          <div className="space-y-3">
            {categorySummary.map((cs: any) => {
              const pct = totalExpenses > 0 ? ((cs._sum.amount / totalExpenses) * 100).toFixed(1) : '0'
              return (
                <div key={cs.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <Badge className={categoryColors[cs.category] || 'bg-gray-100'}>{cs.category}</Badge>
                    <span className="font-medium text-gray-700">{formatNumber(cs._sum.amount)} د.ع ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-red-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {categorySummary.length === 0 && <p className="text-gray-400 text-center py-4">لا توجد بيانات</p>}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <Filter size={16} /> تصفية المصروفات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">من تاريخ</Label>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-9 w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">إلى تاريخ</Label>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-9 w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">التصنيف</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setFromDate(''); setToDate(''); setCategoryFilter('all') }}>
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
          ) : expenses.length === 0 ? (
            <p className="text-gray-400 text-center py-12">لا توجد مصروفات</p>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-sm">{e.expenseNo}</TableCell>
                      <TableCell><Badge className={categoryColors[e.category] || 'bg-gray-100'}>{e.category}</Badge></TableCell>
                      <TableCell className="text-sm">{e.description}</TableCell>
                      <TableCell className="font-bold text-red-700">{formatNumber(e.amount)} د.ع</TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(e.date).toLocaleDateString('ar-IQ')}</TableCell>
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