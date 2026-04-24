'use client'

import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { useIsMobile } from '@/hooks/use-mobile'
import type { NavPage } from '@/lib/types'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Truck,
  RotateCcw,
  Undo2,
  FileBarChart,
  FileSpreadsheet,
  Users,
  Building2,
  Wallet,
  UserCog,
  AlertTriangle,
  Menu,
  X,
  Bell,
  Calculator,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  PieChart,
} from 'lucide-react'

import DashboardView from '@/components/app/DashboardView'
import ProductsView from '@/components/app/ProductsView'
import WarehousesView from '@/components/app/WarehousesView'
import InvoiceForm from '@/components/app/InvoiceForm'
import SalesReport from '@/components/app/SalesReport'
import PurchaseReport from '@/components/app/PurchaseReport'
import CustomersView from '@/components/app/CustomersView'
import SuppliersView from '@/components/app/SuppliersView'
import BalancesView from '@/components/app/BalancesView'
import UsersView from '@/components/app/UsersView'
import StockAlertsView from '@/components/app/StockAlertsView'
import InvoiceDetail from '@/components/app/InvoiceDetail'
import DailyReconciliation from '@/components/app/DailyReconciliation'
import ReceiptVoucher from '@/components/app/ReceiptVoucher'
import PaymentVoucher from '@/components/app/PaymentVoucher'
import ExpenseVoucher from '@/components/app/ExpenseVoucher'
import VouchersReport from '@/components/app/VouchersReport'
import ExpensesReport from '@/components/app/ExpensesReport'

/* ------------------------------------------------------------------ */
/*  Navigation items config                                           */
/* ------------------------------------------------------------------ */
interface NavItem {
  key: NavPage
  label: string
  icon: React.ElementType
  separatorAfter?: boolean
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { key: 'products', label: 'المواد', icon: Package },
  { key: 'warehouses', label: 'المخازن', icon: Warehouse, separatorAfter: true },
  { key: 'sale', label: 'فاتورة بيع', icon: ShoppingCart },
  { key: 'purchase', label: 'فاتورة شراء', icon: Truck },
  { key: 'sale_return', label: 'إرجاع بيع', icon: RotateCcw },
  { key: 'purchase_return', label: 'إرجاع شراء', icon: Undo2, separatorAfter: true },
  { key: 'sales_report', label: 'كشف مبيعات', icon: FileBarChart },
  { key: 'purchase_report', label: 'كشف مشتريات', icon: FileSpreadsheet },
  { key: 'customers', label: 'الزبائن', icon: Users },
  { key: 'suppliers', label: 'المجهزون', icon: Building2, separatorAfter: true },
  { key: 'balances', label: 'الأرصدة', icon: Wallet },
  { key: 'users', label: 'المستخدمون', icon: UserCog },
  { key: 'stock_alerts', label: 'تنبيهات المخزون', icon: AlertTriangle },
  { key: 'receipt_voucher', label: 'سند قبض', icon: ArrowDownLeft },
  { key: 'payment_voucher', label: 'سند دفع', icon: ArrowUpRight },
  { key: 'expense_voucher', label: 'سند صرف', icon: PieChart, separatorAfter: true },
  { key: 'vouchers_report', label: 'كشف السندات', icon: FileText },
  { key: 'expenses_report', label: 'كشف المصروفات', icon: PieChart, separatorAfter: true },
  { key: 'daily_reconciliation', label: 'المطابقة اليومية', icon: Calculator },
]

/* ------------------------------------------------------------------ */
/*  Sidebar Nav Content (shared between desktop & mobile)              */
/* ------------------------------------------------------------------ */
function SidebarNavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { currentPage, setCurrentPage } = useAppStore()

  const handleNavigate = (page: NavPage) => {
    setCurrentPage(page)
    onNavigate?.()
  }

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = currentPage === item.key

        return (
          <div key={item.key}>
            <button
              onClick={() => handleNavigate(item.key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer',
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon size={20} className="flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
            {item.separatorAfter && (
              <Separator className="my-3 bg-slate-700/60" />
            )}
          </div>
        )
      })}
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/*  Page Content Router                                               */
/* ------------------------------------------------------------------ */
function PageContent() {
  const { currentPage } = useAppStore()

  switch (currentPage) {
    case 'dashboard':
      return <DashboardView />
    case 'products':
      return <ProductsView />
    case 'warehouses':
      return <WarehousesView />
    case 'sale':
      return <InvoiceForm type="sale" />
    case 'purchase':
      return <InvoiceForm type="purchase" />
    case 'sale_return':
      return <InvoiceForm type="sale_return" />
    case 'purchase_return':
      return <InvoiceForm type="purchase_return" />
    case 'sales_report':
      return <SalesReport />
    case 'purchase_report':
      return <PurchaseReport />
    case 'customers':
      return <CustomersView />
    case 'suppliers':
      return <SuppliersView />
    case 'balances':
      return <BalancesView />
    case 'users':
      return <UsersView />
    case 'stock_alerts':
      return <StockAlertsView />
    case 'invoice_detail':
      return <InvoiceDetail />
    case 'receipt_voucher':
      return <ReceiptVoucher />
    case 'payment_voucher':
      return <PaymentVoucher />
    case 'expense_voucher':
      return <ExpenseVoucher />
    case 'vouchers_report':
      return <VouchersReport />
    case 'expenses_report':
      return <ExpensesReport />
    case 'daily_reconciliation':
      return <DailyReconciliation />
    default:
      return <DashboardView />
  }
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                               */
/* ------------------------------------------------------------------ */
export default function Home() {
  const { sidebarOpen, setSidebarOpen } = useAppStore()
  const isMobile = useIsMobile()

  const currentPageLabel =
    navItems.find((n) => n.key === useAppStore.getState().currentPage)?.label ??
    'لوحة التحكم'

  return (
    <div className="min-h-screen flex bg-gray-50" dir="rtl" lang="ar">
      {/* ============================================================ */}
      {/*  Desktop Sidebar                                              */}
      {/* ============================================================ */}
      {!isMobile && (
        <aside
          className={cn(
            'fixed top-0 right-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out',
            'bg-slate-900 text-white',
            sidebarOpen ? 'w-[260px]' : 'w-[68px]'
          )}
        >
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 h-16 px-4 border-b border-slate-700/60 flex-shrink-0">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
              م.م
            </div>
            {sidebarOpen && (
              <span className="text-lg font-bold whitespace-nowrap truncate">
                نظام المبيعات
              </span>
            )}
          </div>

          {/* Navigation */}
          <SidebarNavContent />

          {/* Footer */}
          <div className="px-3 py-4 border-t border-slate-700/60 flex-shrink-0">
            <div
              className={cn(
                'text-xs text-slate-500',
                !sidebarOpen && 'text-center'
              )}
            >
              {sidebarOpen ? '© 2025 نظام إدارة المخازن' : '©'}
            </div>
          </div>
        </aside>
      )}

      {/* ============================================================ */}
      {/*  Main Area                                                    */}
      {/* ============================================================ */}
      <div
        className={cn(
          'flex-1 flex flex-col min-h-screen transition-all duration-300',
          !isMobile && (sidebarOpen ? 'mr-[260px]' : 'mr-[68px]')
        )}
      >
        {/* ---------------------------------------------------------- */}
        {/*  Header                                                     */}
        {/* ---------------------------------------------------------- */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          {/* Right side (toggle + title) - in RTL this is the start */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            {isMobile ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-600">
                    <Menu size={22} />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[280px] p-0 bg-slate-900 text-white border-slate-700 [&>button]:left-4 [&>button]:right-auto [&>button]:top-4"
                >
                  <SheetHeader className="p-0">
                    <SheetTitle className="sr-only">القائمة</SheetTitle>
                  </SheetHeader>

                  {/* Mobile sidebar brand */}
                  <div className="flex items-center gap-3 h-16 px-4 border-b border-slate-700/60">
                    <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                      م.م
                    </div>
                    <span className="text-lg font-bold whitespace-nowrap">
                      نظام المبيعات
                    </span>
                    <SheetContentCloseButton />
                  </div>

                  <SidebarNavContent />
                </SheetContent>
              </Sheet>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu size={22} />
              </Button>
            )}

            <h1 className="text-base md:text-lg font-bold text-gray-800 truncate">
              نظام إدارة المبيعات والمخازن
            </h1>
          </div>

          {/* Left side actions - in RTL this is the end */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-700 relative"
              onClick={() => toast.info('لا توجد تنبيهات جديدة')}
            >
              <Bell size={20} />
              <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
            </Button>

            {/* User avatar */}
            <div className="flex items-center gap-2 mr-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-emerald-700">م</span>
              </div>
              {!isMobile && (
                <span className="text-sm font-medium text-gray-600 hidden md:inline">
                  المدير
                </span>
              )}
            </div>
          </div>
        </header>

        {/* ---------------------------------------------------------- */}
        {/*  Page Content                                               */}
        {/* ---------------------------------------------------------- */}
        <main className="flex-1 p-4 md:p-6">
          <PageContent />
        </main>

        {/* ---------------------------------------------------------- */}
        {/*  Footer                                                     */}
        {/* ---------------------------------------------------------- */}
        <footer className="mt-auto px-4 py-3 text-center text-xs text-gray-400 border-t border-gray-100 bg-white">
          نظام إدارة المبيعات والمخازن © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Close button for the Sheet (positioned inside the sheet header)   */
/* ------------------------------------------------------------------ */
function SheetContentCloseButton() {
  return (
    <button
      className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors"
      aria-label="إغلاق"
    >
      <X size={20} />
    </button>
  )
}
