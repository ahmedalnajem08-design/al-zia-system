import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // حذف جميع البيانات بالترتيب الصحيح
    await db.payment.deleteMany()
    await db.voucher.deleteMany()
    await db.expense.deleteMany()
    await db.invoiceItem.deleteMany()
    await db.invoice.deleteMany()
    await db.warehouseStock.deleteMany()
    await db.productUnit.deleteMany()
    await db.product.deleteMany()
    await db.productCategory.deleteMany()
    await db.customer.deleteMany()
    await db.supplier.deleteMany()
    await db.warehouse.deleteMany()
    await db.user.deleteMany()

    return NextResponse.json({ message: 'تم مسح جميع البيانات بنجاح' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في مسح البيانات' }, { status: 500 })
  }
}
