'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { LogIn, Loader2, Users, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'

interface ActiveUser {
  id: string
  name: string
  role: string
}

/* ------------------------------------------------------------------ */
/*  Color palette per user (deterministic, based on name hash)         */
/* ------------------------------------------------------------------ */
const avatarColors = [
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-violet-500',
  'bg-fuchsia-500',
  'bg-pink-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-lime-500',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'admin': return 'أدمن'
    case 'manager': return 'مدير'
    default: return 'مستخدم'
  }
}

/* ------------------------------------------------------------------ */
/*  Login Page Component                                               */
/* ------------------------------------------------------------------ */
export default function LoginPage() {
  const [users, setUsers] = useState<ActiveUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null)
  const [password, setPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const setCurrentUser = useAppStore((s) => s.setCurrentUser)

  useEffect(() => {
    async function fetchActiveUsers() {
      try {
        const res = await fetch('/api/users')
        if (!res.ok) throw new Error()
        const data = await res.json()
        const active = (data || []).filter((u: any) => u.isActive)
        setUsers(active)
      } catch {
        toast.error('خطأ في جلب المستخدمين')
      } finally {
        setLoading(false)
      }
    }
    fetchActiveUsers()
  }, [])

  async function handleLogin() {
    if (!selectedUser || !password.trim()) {
      toast.error('أدخل كلمة المرور')
      return
    }
    setLoggingIn(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedUser.name, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'خطأ في تسجيل الدخول')
      }
      setCurrentUser({ id: data.id, name: data.name, role: data.role })
      toast.success(`مرحباً ${data.name}`)
    } catch (err: any) {
      toast.error(err.message || 'خطأ في تسجيل الدخول')
    } finally {
      setLoggingIn(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLogin()
  }

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      dir="rtl"
      lang="ar"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.08)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,0,0,0.15)_0%,_transparent_60%)]" />

      {/* Floating decorative circles */}
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/5 blur-2xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl animate-pulse [animation-delay:2s]" />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-cyan-400/10 blur-2xl animate-pulse [animation-delay:4s]" />

      {/* Main card */}
      <Card className="relative z-10 w-full max-w-lg bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
        {/* Card header with gradient accent */}
        <div className="bg-gradient-to-l from-emerald-600 to-teal-600 px-8 pt-8 pb-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]" />
          <div className="relative z-10">
            {/* Brand logo */}
            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20 overflow-hidden">
              <img src="/logo.png" alt="نظام الضياء" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">نظام الضياء</h1>
            <p className="text-emerald-100 text-sm">نظام إدارة المبيعات والمخازن</p>
          </div>
        </div>

        {/* Card body */}
        <div className="px-8 pb-8 -mt-5">
          <Card className="bg-white shadow-lg border border-gray-100 rounded-2xl p-6">
            {/* Loading state */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
                <p className="text-gray-500 text-sm">جارٍ تحميل المستخدمين...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="text-amber-600" size={28} />
                </div>
                <p className="text-gray-700 font-bold mb-1">لا يوجد مستخدمين نشطين</p>
                <p className="text-gray-400 text-sm">قم بإنشاء مستخدمين من خلال إعادة تعيين البيانات</p>
              </div>
            ) : !selectedUser ? (
              /* ---- User selection grid ---- */
              <div>
                <p className="text-gray-600 text-sm font-medium mb-4 text-center">اختر حسابك للدخول</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {users.map((user) => {
                    const color = getAvatarColor(user.name)
                    return (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                      >
                        <div
                          className={`${color} w-14 h-14 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200`}
                        >
                          <span className="text-white text-lg font-bold">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold text-gray-700 truncate max-w-[80px]">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-gray-400">{getRoleLabel(user.role)}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* ---- Password entry ---- */
              <div className="space-y-5">
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`${getAvatarColor(selectedUser.name)} w-16 h-16 rounded-full flex items-center justify-center shadow-lg mb-3`}
                  >
                    <span className="text-white text-xl font-bold">
                      {selectedUser.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{selectedUser.name}</h3>
                  <p className="text-xs text-gray-400">{getRoleLabel(selectedUser.role)}</p>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      type="password"
                      placeholder="كلمة المرور"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="pr-10 h-12 text-base bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(null)
                      setPassword('')
                    }}
                    className="flex-1 h-12 border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    رجوع
                  </Button>
                  <Button
                    onClick={handleLogin}
                    disabled={loggingIn || !password.trim()}
                    className="flex-1 h-12 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-200 gap-2"
                  >
                    {loggingIn ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <LogIn size={18} />
                    )}
                    دخول
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </Card>
    </div>
  )
}
