# نظام الضياء - نظام إدارة المبيعات والمخازن

## 🚀 طريقة النشر على Vercel (مجاني)

### الخطوة 1: إنشاء قاعدة بيانات مجانية (Neon PostgreSQL)
1. اذهب إلى https://neon.tech وإنشاء حساب مجاني
2. أنشئ مشروع جديد (Project)
3. نسخ رابط الاتصال (Connection String) - سيبدو مثل:
   ```
   postgresql://neondb_owner:xxxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### الخطوة 2: إنشاء مستودع GitHub
1. اذهب إلى https://github.com/new
2. أنشئ مستودع جديد باسم `zaya-inventory-system`
3. لا تضف README أو .gitignore (المشروع جاهز)
4. بعد الإنشاء، ستحصل على رابط مثل:
   ```
   https://github.com/USERNAME/zaya-inventory-system.git
   ```

### الخطوة 3: رفع المشروع على GitHub
من سطر الأوامر في مجلد المشروع:
```bash
git remote add origin https://github.com/USERNAME/zaya-inventory-system.git
git branch -M main
git push -u origin main
```

### الخطوة 4: نشر على Vercel
1. اذهب إلى https://vercel.com وإنشاء حساب (مجاني)
2. اضغط "Add New Project"
3. اختر المستودع من GitHub
4. في إعدادات البيئة (Environment Variables)، أضف:
   - `DATABASE_URL` = رابط الاتصال من Neon (الخطوة 1)
5. اضغط "Deploy"
6. انتظر حتى ينتهي النشر

### الخطوة 5: زراعة البيانات
بعد النشر، اذهب إلى الرابط واضغط على:
```
https://YOUR-APP.vercel.app/api/seed
```
مع تحويل الطلب إلى POST (استخدم Postman أو curl):
```bash
curl -X POST https://YOUR-APP.vercel.app/api/seed
```

### بيانات الدخول الافتراضية
- **الاسم:** مدير النظام
- **كلمة المرور:** 1234

## 📋 المميزات
- لوحة تحكم مع إحصائيات
- إدارة المنتجات والمخازن
- فواتير البيع والشراء
- الإرجاعات
- سندات القبض والدفع
- سندات الصرف والمصروفات
- المطابقة اليومية
- التقارير المالية
- إدارة المستخدمين والصلاحيات
- تنبيهات المخزون
