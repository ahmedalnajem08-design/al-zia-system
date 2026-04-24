'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Phone,
  Loader2,
  ArrowUpLeft,
  ArrowDownLeft,
  Users,
  Building2,
  Filter,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

import { useAppStore } from '@/lib/store'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CustomerBalance {
  id: string
  name: string
  phone: string | null
  balance: number
  totalSales: number
  totalPayments: number
}

interface SupplierBalance {
  id: string
  name: string
  phone: string | null
  balance: number
  totalPurchases: number
  totalPayments: number
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatNumber(value: number): string {
  return value.toLocaleString('ar-IQ', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function BalancesView() {
  const { setCurrentPage, setSelectedCustomerId, setSelectedSupplierId } = useAppStore()

  // Data
  const [customers, setCustomers] = useState<CustomerBalance[]>([])
  const [suppliers, setSuppliers] = useState<SupplierBalance[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [receivableFilter, setReceivableFilter] = useState<string>('all')

  /* ---- Fetch data ---- */
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [custRes, suppRes] = await Promise.all([
        fetch('/api/customers?withBalances=true&limit=500'),
        fetch('/api/suppliers?withBalances=true&limit=500'),
      ])

      if (!custRes.ok || !suppRes.ok) throw new Error('فشل في جلب البيانات')

      const custData = await custRes.json()
      const suppData = await suppRes.json()

      setCustomers(custData.customers || [])
      setSuppliers(suppData.suppliers || [])
    } catch {
      toast.error('خطأ في جلب بيانات الأرصدة')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* ---- Computed ---- */
  const totalReceivables = customers
    .filter((c) => c.balance > 0)
    .reduce((sum, c) => sum + c.balance, 0)

  const totalPayables = suppliers
    .filter((s) => s.balance > 0)
    .reduce((sum, s) => sum + s.balance, 0)

  // Filtered receivables
  const filteredReceivables = customers
    .filter((c) => {
      if (receivableFilter === 'positive') return c.balance > 0
      return true
    })
    .sort((a, b) => b.balance - a.balance)

  // Filtered payables
  const filteredPayables = suppliers
    .filter((s) => s.balance > 0)
    .sort((a, b) => a.balance - b.balance)

  /* ---- Navigation ---- */
  function goToCustomer(customerId: string) {
    setSelectedCustomerId(customerId)
    setCurrentPage('customers')
  }

  function goToSupplier(supplierId: string) {
    setSelectedSupplierId(supplierId)
    setCurrentPage('suppliers')
  }

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* ---- Title ---- */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Wallet className="text-amber-600" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">الأرصدة</h2>
          <p className="text-sm text-gray-500">إجمالي المستحقات والالتزامات</p>
        </div>
      </div>

      {/* ---- Summary Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Receivables */}
        {loading ? (
          <Skeleton className="h-28 rounded-2xl" />
        ) : (
          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl overflow-hidden relative">
            <div className="absolute -left-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
            <div className="absolute -left-2 bottom-0 w-16 h-16 bg-white/5 rounded-full" />
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">
                    إجمالي المستحقات من الزبائن
                  </p>
                  <p className="text-2xl font-bold">{formatNumber(totalReceivables)} د.ع</p>
                  <p className="text-emerald-200 text-xs mt-1">
                    {customers.filter((c) => c.balance > 0).length} زبون عليه رصيد
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Total Payables */}
        {loading ? (
          <Skeleton className="h-28 rounded-2xl" />
        ) : (
          <Card className="border-0 shadow-sm bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl overflow-hidden relative">
            <div className="absolute -left-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
            <div className="absolute -left-2 bottom-0 w-16 h-16 bg-white/5 rounded-full" />
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium mb-1">
                    إجمالي المستحقات للمجهزين
                  </p>
                  <p className="text-2xl font-bold">{formatNumber(totalPayables)} د.ع</p>
                  <p className="text-red-200 text-xs mt-1">
                    {suppliers.filter((s) => s.balance > 0).length} مجهز عليه رصيد
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingDown size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ---- Tabs ---- */}
      <Tabs defaultValue="receivables" className="w-full">
        <TabsList className="bg-gray-100 p-1 h-auto">
          <TabsTrigger
            value="receivables"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white gap-2 text-sm px-4 py-2 rounded-lg"
          >
            <ArrowDownLeft size={16} />
            المستحقات من الزبائن
            {!loading && customers.filter((c) => c.balance > 0).length > 0 && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs mr-1">
                {customers.filter((c) => c.balance > 0).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="payables"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white gap-2 text-sm px-4 py-2 rounded-lg"
          >
            <ArrowUpLeft size={16} />
            المستحقات للمجهزين
            {!loading && suppliers.filter((s) => s.balance > 0).length > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs mr-1">
                {suppliers.filter((s) => s.balance > 0).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/*  Receivables Tab                                             */}
        {/* ============================================================ */}
        <TabsContent value="receivables" className="mt-4">
          {/* Filter */}
          <div className="flex items-center gap-3 mb-4">
            <Filter size={16} className="text-gray-400" />
            <Select value={receivableFilter} onValueChange={setReceivableFilter}>
              <SelectTrigger className="w-48 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">عرض الكل</SelectItem>
                <SelectItem value="positive">رصيد مستحق فقط</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : filteredReceivables.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="text-gray-300 mb-4" size={56} />
                <p className="text-gray-500 text-lg font-medium">
                  {receivableFilter === 'positive'
                    ? 'لا توجد مستحقات من الزبائن'
                    : 'لا يوجد زبائن'}
                </p>
                <p className="text-gray-400 text-sm mt-1">جميع الأرصدة مسددة</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border-gray-100 shadow-sm overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="text-gray-600 font-semibold text-xs">الزبون</TableHead>
                      <TableHead className="text-gray-600 font-semibold text-xs">الهاتف</TableHead>
                      <TableHead className="text-gray-600 font-semibold text-xs text-center">
                        إجمالي المبيعات
                      </TableHead>
                      <TableHead className="text-gray-600 font-semibold text-xs text-center">
                        إجمالي المدفوعات
                      </TableHead>
                      <TableHead className="text-gray-600 font-semibold text-xs text-center">
                        الرصيد المستحق
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceivables.map((customer) => (
                      <TableRow
                        key={customer.id}
                        className="hover:bg-emerald-50/50 transition-colors cursor-pointer"
                        onClick={() => goToCustomer(customer.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-emerald-700 font-bold text-xs">
                                {customer.name.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-gray-800 text-sm">
                              {customer.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.phone ? (
                            <span className="flex items-center gap-1.5 text-gray-600 text-sm">
                              <Phone size={13} className="text-gray-400" />
                              {customer.phone}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-sm text-gray-700">
                          {formatNumber(customer.totalSales)}
                        </TableCell>
                        <TableCell className="text-center text-sm text-emerald-600 font-medium">
                          {formatNumber(customer.totalPayments)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`font-bold text-xs px-2.5 py-1 ${
                              customer.balance > 0
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : 'bg-gray-50 text-gray-500 border border-gray-200'
                            }`}
                          >
                            {formatNumber(Math.abs(customer.balance))} د.ع
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/*  Payables Tab                                                */}
        {/* ============================================================ */}
        <TabsContent value="payables" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : filteredPayables.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Building2 className="text-gray-300 mb-4" size={56} />
                <p className="text-gray-500 text-lg font-medium">لا توجد مستحقات للمجهزين</p>
                <p className="text-gray-400 text-sm mt-1">جميع الأرصدة مسددة</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border-gray-100 shadow-sm overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="text-gray-600 font-semibold text-xs">المجهز</TableHead>
                      <TableHead className="text-gray-600 font-semibold text-xs">الهاتف</TableHead>
                      <TableHead className="text-gray-600 font-semibold text-xs text-center">
                        إجمالي المشتريات
                      </TableHead>
                      <TableHead className="text-gray-600 font-semibold text-xs text-center">
                        إجمالي المدفوعات
                      </TableHead>
                      <TableHead className="text-gray-600 font-semibold text-xs text-center">
                        الرصيد المستحق
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayables.map((supplier) => (
                      <TableRow
                        key={supplier.id}
                        className="hover:bg-red-50/50 transition-colors cursor-pointer"
                        onClick={() => goToSupplier(supplier.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-red-700 font-bold text-xs">
                                {supplier.name.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-gray-800 text-sm">
                              {supplier.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {supplier.phone ? (
                            <span className="flex items-center gap-1.5 text-gray-600 text-sm">
                              <Phone size={13} className="text-gray-400" />
                              {supplier.phone}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-sm text-gray-700">
                          {formatNumber(supplier.totalPurchases)}
                        </TableCell>
                        <TableCell className="text-center text-sm text-emerald-600 font-medium">
                          {formatNumber(supplier.totalPayments)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`font-bold text-xs px-2.5 py-1 ${
                              supplier.balance > 0
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : 'bg-gray-50 text-gray-500 border border-gray-200'
                            }`}
                          >
                            {formatNumber(Math.abs(supplier.balance))} د.ع
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
