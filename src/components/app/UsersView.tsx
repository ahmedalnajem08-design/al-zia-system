'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserCog,
  Phone,
  Mail,
  Loader2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Calendar,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UserData {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface FormData {
  name: string
  email: string
  password: string
  phone: string
  role: string
  isActive: boolean
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const emptyForm: FormData = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'user',
  isActive: true,
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getRoleBadge(role: string): { label: string; className: string; icon: React.ElementType } {
  switch (role) {
    case 'admin':
      return {
        label: 'أدمن',
        className: 'bg-red-50 text-red-700 border-red-200',
        icon: ShieldAlert,
      }
    case 'manager':
      return {
        label: 'مدير',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: ShieldCheck,
      }
    default:
      return {
        label: 'مستخدم',
        className: 'bg-gray-50 text-gray-600 border-gray-200',
        icon: Shield,
      }
  }
}

function getRoleDescription(role: string): string {
  switch (role) {
    case 'admin':
      return 'صلاحيات كاملة - وصول لجميع الوظائف'
    case 'manager':
      return 'إدارة المواد والمخازن والفواتير والتقارير'
    case 'user':
      return 'إنشاء الفواتير وعرض التقارير فقط'
    default:
      return ''
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function UsersView() {
  /* ---- State ---- */
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Add / Edit dialog
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [formSaving, setFormSaving] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null)
  const [deleting, setDeleting] = useState(false)

  /* ---- Fetch users ---- */
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('فشل في جلب البيانات')
      const data = await res.json()
      setUsers(data || [])
    } catch {
      toast.error('خطأ في جلب المستخدمين')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (!debouncedSearch) return true
    const q = debouncedSearch.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q))
    )
  })

  /* ---- Add / Edit ---- */
  function openAddDialog() {
    setEditingUser(null)
    setFormData(emptyForm)
    setFormDialogOpen(true)
  }

  function openEditDialog(user: UserData) {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      role: user.role,
      isActive: user.isActive,
    })
    setFormDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error('الاسم مطلوب')
      return
    }
    if (!formData.email.trim()) {
      toast.error('البريد الإلكتروني مطلوب')
      return
    }
    if (!editingUser && !formData.password.trim()) {
      toast.error('كلمة المرور مطلوبة')
      return
    }

    setFormSaving(true)
    try {
      const isEdit = !!editingUser
      const url = isEdit ? `/api/users/${editingUser.id}` : '/api/users'
      const method = isEdit ? 'PUT' : 'POST'

      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        role: formData.role,
        isActive: formData.isActive,
      }

      if (!isEdit || formData.password) {
        payload.password = formData.password
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'فشل في الحفظ')
      }
      toast.success(isEdit ? 'تم تحديث بيانات المستخدم' : 'تم إضافة المستخدم بنجاح')
      setFormDialogOpen(false)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'خطأ في الحفظ')
    } finally {
      setFormSaving(false)
    }
  }

  /* ---- Delete ---- */
  function openDeleteDialog(user: UserData) {
    setDeletingUser(user)
    setDeleteDialogOpen(true)
  }

  async function handleDelete() {
    if (!deletingUser) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'فشل في الحذف')
      }
      toast.success('تم حذف المستخدم بنجاح')
      setDeleteDialogOpen(false)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'خطأ في حذف المستخدم')
    } finally {
      setDeleting(false)
    }
  }

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="space-y-6">
      {/* ---- Top Bar ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <UserCog className="text-purple-600" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">إدارة المستخدمين والصلاحيات</h2>
            <p className="text-sm text-gray-500">
              {users.length} مستخدم مسجل
            </p>
          </div>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-sm"
        >
          <Plus size={18} />
          إضافة مستخدم
        </Button>
      </div>

      {/* ---- Search ---- */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="بحث بالاسم أو البريد الإلكتروني..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10 bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
        />
      </div>

      {/* ---- Users Table ---- */}
      {loading ? (
        <Card className="bg-white border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 bg-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <UserCog className="text-gray-300 mb-4" size={56} />
            <p className="text-gray-500 text-lg font-medium">
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا يوجد مستخدمين بعد'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {searchQuery ? 'حاول تغيير كلمات البحث' : 'اضغط على الزر أعلاه لإضافة مستخدم جديد'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border-gray-100 shadow-sm overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="text-gray-600 font-semibold text-xs">الاسم</TableHead>
                  <TableHead className="text-gray-600 font-semibold text-xs">البريد الإلكتروني</TableHead>
                  <TableHead className="text-gray-600 font-semibold text-xs">الهاتف</TableHead>
                  <TableHead className="text-gray-600 font-semibold text-xs text-center">الدور</TableHead>
                  <TableHead className="text-gray-600 font-semibold text-xs text-center">الحالة</TableHead>
                  <TableHead className="text-gray-600 font-semibold text-xs text-center">
                    تاريخ الإنشاء
                  </TableHead>
                  <TableHead className="text-gray-600 font-semibold text-xs text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const roleBadge = getRoleBadge(user.role)
                  const RoleIcon = roleBadge.icon

                  return (
                    <TableRow key={user.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Name */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              user.role === 'admin'
                                ? 'bg-red-100'
                                : user.role === 'manager'
                                ? 'bg-blue-100'
                                : 'bg-gray-100'
                            }`}
                          >
                            <span
                              className={`font-bold text-xs ${
                                user.role === 'admin'
                                  ? 'text-red-700'
                                  : user.role === 'manager'
                                  ? 'text-blue-700'
                                  : 'text-gray-600'
                              }`}
                            >
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium text-gray-800 text-sm">{user.name}</span>
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-gray-600 text-sm">
                          <Mail size={13} className="text-gray-400" />
                          {user.email}
                        </span>
                      </TableCell>

                      {/* Phone */}
                      <TableCell>
                        {user.phone ? (
                          <span className="flex items-center gap-1.5 text-gray-600 text-sm">
                            <Phone size={13} className="text-gray-400" />
                            {user.phone}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </TableCell>

                      {/* Role */}
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`gap-1 text-xs ${roleBadge.className}`}
                        >
                          <RoleIcon size={12} />
                          {roleBadge.label}
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            user.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs'
                              : 'bg-red-50 text-red-600 border-red-200 text-xs'
                          }
                        >
                          {user.isActive ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>

                      {/* Created Date */}
                      <TableCell className="text-center">
                        <span className="flex items-center gap-1 text-gray-500 text-xs justify-center">
                          <Calendar size={12} className="text-gray-400" />
                          {formatDate(user.createdAt)}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-purple-600 hover:bg-purple-50"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => openDeleteDialog(user)}
                            disabled={user.role === 'admin'}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/*  Add / Edit Dialog                                            */}
      {/* ============================================================ */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <UserCog size={20} className="text-purple-600" />
              {editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* الاسم */}
            <div className="grid gap-2">
              <Label htmlFor="u-name">
                الاسم <span className="text-red-500">*</span>
              </Label>
              <Input
                id="u-name"
                placeholder="اسم المستخدم"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* البريد الإلكتروني */}
            <div className="grid gap-2">
              <Label htmlFor="u-email">
                البريد الإلكتروني <span className="text-red-500">*</span>
              </Label>
              <Input
                id="u-email"
                type="email"
                placeholder="البريد الإلكتروني"
                value={formData.email}
                onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                dir="ltr"
                className="text-left"
              />
            </div>

            {/* كلمة المرور */}
            <div className="grid gap-2">
              <Label htmlFor="u-password">
                كلمة المرور{' '}
                {!editingUser && <span className="text-red-500">*</span>}
                {editingUser && (
                  <span className="text-gray-400 text-xs font-normal">(اتركه فارغاً للإبقاء)</span>
                )}
              </Label>
              <Input
                id="u-password"
                type="password"
                placeholder={editingUser ? 'كلمة المرور الجديدة (اختياري)' : 'كلمة المرور'}
                value={formData.password}
                onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))}
                dir="ltr"
                className="text-left"
              />
            </div>

            {/* الهاتف */}
            <div className="grid gap-2">
              <Label htmlFor="u-phone">الهاتف</Label>
              <Input
                id="u-phone"
                placeholder="رقم الهاتف"
                value={formData.phone}
                onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                dir="ltr"
                className="text-left"
              />
            </div>

            {/* الدور */}
            <div className="grid gap-2">
              <Label>الدور</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData((f) => ({ ...f, role: v }))}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex flex-col gap-0.5 py-1">
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={14} className="text-red-500" />
                        <span className="font-medium">أدمن</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        صلاحيات كاملة - وصول لجميع الوظائف
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex flex-col gap-0.5 py-1">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-blue-500" />
                        <span className="font-medium">مدير</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        إدارة المواد والمخازن والفواتير والتقارير
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex flex-col gap-0.5 py-1">
                      <div className="flex items-center gap-2">
                        <Shield size={14} className="text-gray-500" />
                        <span className="font-medium">مستخدم</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        إنشاء الفواتير وعرض التقارير فقط
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {formData.role && (
                <p className="text-xs text-gray-500 mt-1 bg-gray-50 px-3 py-2 rounded-lg">
                  {getRoleDescription(formData.role)}
                </p>
              )}
            </div>

            {/* الحالة */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="u-active" className="text-sm font-medium cursor-pointer">
                  الحالة
                </Label>
                <Badge
                  variant="outline"
                  className={
                    formData.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs'
                      : 'bg-red-50 text-red-600 border-red-200 text-xs'
                  }
                >
                  {formData.isActive ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
              <Switch
                id="u-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData((f) => ({ ...f, isActive: checked }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setFormDialogOpen(false)}
              disabled={formSaving}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={formSaving}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {formSaving && <Loader2 size={16} className="animate-spin ml-2" />}
              {editingUser ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/*  Delete Confirmation Dialog                                   */}
      {/* ============================================================ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              هل أنت متأكد من حذف المستخدم &quot;{deletingUser?.name}&quot;؟ لا يمكن التراجع عن هذا
              الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 size={16} className="animate-spin ml-2" />}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
