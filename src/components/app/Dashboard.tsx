'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart, Truck, Package, AlertTriangle, Users, Building2,
  TrendingUp, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

function formatNumber(n: number) {
  return new Intl.NumberFormat('ar-IQ').format(Math.round(n))
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6 h-28" />
          </Card>
        ))}
      </div>
    )
  }

  const statusLabel: Record<string, string> = {
    sale: 'بيع',
    purchase: 'شراء',
    sale_return: 'إرجاع بيع',
    purchase_return: 'إرجاع شراء',
  }
  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  const statusText: Record<string, string> = {
    draft: 'مسودة',
    confirmed: 'مؤكدة',
    cancelled: 'ملغاة',
  }

  const cards = [
    { title: 'مبيعات اليوم', value: formatNumber(stats.totalSalesToday), icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'مشتريات اليوم', value: formatNumber(stats.totalPurchasesToday), icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'إجمالي المنتجات', value: formatNumber(stats.totalProducts), icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'مخزون منخفض', value: formatNumber(stats.lowStockCount), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'الزبائن', value: formatNumber(stats.totalCustomers), icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
    { title: 'المجهزون', value: formatNumber(stats.totalSuppliers), icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${c.bg}`}>
                <c.icon size={24} className={c.color} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{c.title}</p>
                <p className="text-2xl font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-600" />
              أكثر المنتجات مبيعاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-gray-400 text-center py-8">لا توجد بيانات</p>
            ) : (
              <div className="space-y-4">
                {stats.topProducts.map((p: any, i: number) => {
                  const maxTotal = stats.topProducts[0]?._sum?.total || 1
                  const pct = ((p._sum.total / maxTotal) * 100).toFixed(0)
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{p.productName}</span>
                        <span className="text-gray-500">{formatNumber(p._sum.total)} د.ع</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className="bg-emerald-500 h-2.5 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-emerald-600" />
              آخر الفواتير
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentInvoices.length === 0 ? (
              <p className="text-gray-400 text-center py-8">لا توجد فواتير</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {stats.recentInvoices.map((inv: any) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{inv.invoiceNo}</span>
                        <Badge variant="outline" className="text-xs">
                          {statusLabel[inv.type]}
                        </Badge>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[inv.status]}`}>
                          {statusText[inv.status]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {inv.customer?.name || inv.supplier?.name || '—'} • {inv.warehouse?.name}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">{formatNumber(inv.total)}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(inv.date).toLocaleDateString('ar-IQ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
