'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, Truck,
  RotateCcw, Undo2, FileBarChart, FileSpreadsheet,
  Users, Building2, Wallet, UserCog, AlertTriangle,
  ChevronRight, Menu, X
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { NavPage } from '@/lib/types'

const navItems: { key: NavPage; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { key: 'products', label: 'المواد', icon: Package },
  { key: 'warehouses', label: 'المخازن', icon: Warehouse },
  { key: 'sale-invoice', label: 'فاتورة بيع', icon: ShoppingCart },
  { key: 'purchase-invoice', label: 'فاتورة شراء', icon: Truck },
  { key: 'sale-return', label: 'إرجاع بيع', icon: RotateCcw },
  { key: 'purchase-return', label: 'إرجاع شراء', icon: Undo2 },
  { key: 'sales-report', label: 'كشف مبيعات', icon: FileBarChart },
  { key: 'purchase-report', label: 'كشف مشتريات', icon: FileSpreadsheet },
  { key: 'customers', label: 'الزبائن', icon: Users },
  { key: 'suppliers', label: 'المجهزون', icon: Building2 },
  { key: 'balances', label: 'الأرصدة', icon: Wallet },
  { key: 'users', label: 'المستخدمون', icon: UserCog },
  { key: 'stock-alerts', label: 'تنبيهات المخزون', icon: AlertTriangle },
]

export default function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, toggleSidebar } = useAppStore()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 right-4 z-50 lg:hidden bg-emerald-600 text-white p-1.5 rounded-lg shadow-lg overflow-hidden"
      >
        {sidebarOpen ? <X size={20} /> : <img src="/logo-64.png" alt="الضياء" className="w-7 h-7 object-cover" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-64 bg-slate-800 text-white z-50 transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:w-16'
        )}
      >
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <div className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden">
            <img src="/logo-64.png" alt="الضياء" className="w-full h-full object-cover" />
          </div>
          <span className={cn(
            'font-bold text-lg whitespace-nowrap transition-opacity',
            !sidebarOpen && 'lg:hidden'
          )}>
            نظام الضياء
          </span>
        </div>

        <nav className="mt-2 px-2 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)]">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.key
            return (
              <button
                key={item.key}
                onClick={() => {
                  setCurrentPage(item.key)
                  if (window.innerWidth < 1024) toggleSidebar()
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                )}
                title={item.label}
              >
                <Icon size={20} className="flex-shrink-0" />
                <span className={cn('whitespace-nowrap', !sidebarOpen && 'lg:hidden')}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export function PageTitle() {
  const { currentPage } = useAppStore()
  const item = navItems.find(n => n.key === currentPage)
  return (
    <h1 className="text-2xl font-bold text-gray-900">
      {item?.label || 'لوحة التحكم'}
    </h1>
  )
}
