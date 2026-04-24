import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Clear all existing data in order to avoid foreign key issues
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

    // ==================== Create Admin User ====================
    const admin = await db.user.create({
      data: {
        name: 'مدير النظام',
        password: '1234',
        role: 'admin',
        isActive: true,
      },
    })

    // ==================== Create Warehouses ====================
    const w1 = await db.warehouse.create({
      data: { name: 'المخزن الرئيسي', address: 'دمشق - المزة', phone: '011-1234567' },
    })
    const w2 = await db.warehouse.create({
      data: { name: 'مخزن الفرع', address: 'حلب - السريان', phone: '021-7654321' },
    })

    // ==================== Create Categories ====================
    const c1 = await db.productCategory.create({ data: { name: 'إلكترونيات' } })
    const c2 = await db.productCategory.create({ data: { name: 'أجهزة منزلية' } })
    const c3 = await db.productCategory.create({ data: { name: 'مواد غذائية' } })
    const c4 = await db.productCategory.create({ data: { name: 'مستلزمات مكتبية' } })
    const c5 = await db.productCategory.create({ data: { name: 'أدوات صحية' } })

    // ==================== Helper: Create product with units ====================
    async function createProduct(
      name: string,
      sku: string,
      barcode: string,
      categoryId: string,
      cost: number,
      sell: number,
      units: { name: string; factor: number; cost: number; sell: number }[]
    ) {
      return db.product.create({
        data: {
          name,
          sku,
          barcode,
          categoryId,
          costPrice: cost,
          sellPrice: sell,
          units: {
            create: units.map((u, i) => ({
              name: u.name,
              conversionFactor: u.factor,
              costPrice: u.cost,
              sellPrice: u.sell,
              isDefault: i === 0,
            })),
          },
        },
        include: { units: true },
      })
    }

    // ==================== Create Products (20 products with 2-3 units each) ====================
    const products: any[] = []

    // إلكترونيات
    products.push(await createProduct('هاتف ذكي سامسونج', 'EL001', '6281001000001', c1.id, 120000, 160000, [
      { name: 'قطعة', factor: 1, cost: 120000, sell: 160000 },
      { name: 'كرتونة (10 قطع)', factor: 10, cost: 1200000, sell: 1600000 },
    ]))
    products.push(await createProduct('سماعات بلوتوث', 'EL002', '6281001000002', c1.id, 8000, 12000, [
      { name: 'قطعة', factor: 1, cost: 8000, sell: 12000 },
      { name: 'كرتونة (24 قطعة)', factor: 24, cost: 192000, sell: 288000 },
    ]))
    products.push(await createProduct('شاحن سريع USB-C', 'EL003', '6281001000003', c1.id, 3000, 5000, [
      { name: 'قطعة', factor: 1, cost: 3000, sell: 5000 },
      { name: 'كرتونة (50 قطعة)', factor: 50, cost: 150000, sell: 250000 },
    ]))
    products.push(await createProduct('ماوس لاسلكي', 'EL004', '6281001000004', c1.id, 4000, 6500, [
      { name: 'قطعة', factor: 1, cost: 4000, sell: 6500 },
      { name: 'كرتونة (20 قطعة)', factor: 20, cost: 80000, sell: 130000 },
    ]))

    // أجهزة منزلية
    products.push(await createProduct('مكنسة كهربائية صغيرة', 'HM001', '6281001000005', c2.id, 25000, 35000, [
      { name: 'قطعة', factor: 1, cost: 25000, sell: 35000 },
      { name: 'كرتونة (4 قطع)', factor: 4, cost: 100000, sell: 140000 },
    ]))
    products.push(await createProduct('مروحة طاولة', 'HM002', '6281001000006', c2.id, 15000, 22000, [
      { name: 'قطعة', factor: 1, cost: 15000, sell: 22000 },
      { name: 'كرتونة (6 قطع)', factor: 6, cost: 90000, sell: 132000 },
    ]))
    products.push(await createProduct('غلاية كهربائية 1.7 لتر', 'HM003', '6281001000007', c2.id, 8000, 12000, [
      { name: 'قطعة', factor: 1, cost: 8000, sell: 12000 },
      { name: 'كرتونة (8 قطع)', factor: 8, cost: 64000, sell: 96000 },
    ]))
    products.push(await createProduct('مصباح LED طاولة', 'HM004', '6281001000008', c2.id, 5000, 8000, [
      { name: 'قطعة', factor: 1, cost: 5000, sell: 8000 },
      { name: 'كرتونة (12 قطعة)', factor: 12, cost: 60000, sell: 96000 },
    ]))

    // مواد غذائية
    products.push(await createProduct('رز بسمتي 5 كغ', 'FD001', '6281001000009', c3.id, 3500, 4500, [
      { name: 'كيس', factor: 1, cost: 3500, sell: 4500 },
      { name: 'كرتونة (6 كيس)', factor: 6, cost: 21000, sell: 27000 },
    ]))
    products.push(await createProduct('زيت زيتون 1 لتر', 'FD002', '6281001000010', c3.id, 8000, 11000, [
      { name: 'عبوة', factor: 1, cost: 8000, sell: 11000 },
      { name: 'كرتونة (12 عبوة)', factor: 12, cost: 96000, sell: 132000 },
    ]))
    products.push(await createProduct('سكر 1 كغ', 'FD003', '6281001000011', c3.id, 1500, 2000, [
      { name: 'كيس', factor: 1, cost: 1500, sell: 2000 },
      { name: 'كرتونة (25 كيس)', factor: 25, cost: 37500, sell: 50000 },
    ]))
    products.push(await createProduct('عسل طبيعي 500 غ', 'FD004', '6281001000012', c3.id, 12000, 18000, [
      { name: 'عبوة', factor: 1, cost: 12000, sell: 18000 },
      { name: 'كرتونة (12 عبوة)', factor: 12, cost: 144000, sell: 216000 },
    ]))
    products.push(await createProduct('معكرونة 500 غ', 'FD005', '6281001000013', c3.id, 300, 450, [
      { name: 'عبوة', factor: 1, cost: 300, sell: 450 },
      { name: 'كرتونة (24 عبوة)', factor: 24, cost: 7200, sell: 10800 },
    ]))

    // مستلزمات مكتبية
    products.push(await createProduct('ورق طباعة A4 (500 ورقة)', 'OF001', '6281001000014', c4.id, 2500, 3500, [
      { name: 'رزمة', factor: 1, cost: 2500, sell: 3500 },
      { name: 'كرتونة (5 رزم)', factor: 5, cost: 12500, sell: 17500 },
    ]))
    products.push(await createProduct('قلم حبر أزرق', 'OF002', '6281001000015', c4.id, 150, 250, [
      { name: 'قطعة', factor: 1, cost: 150, sell: 250 },
      { name: 'علبة (50 قطعة)', factor: 50, cost: 7500, sell: 12500 },
    ]))
    products.push(await createProduct('ملف بلاستيك A4', 'OF003', '6281001000016', c4.id, 200, 350, [
      { name: 'قطعة', factor: 1, cost: 200, sell: 350 },
      { name: 'كرتونة (100 قطعة)', factor: 100, cost: 20000, sell: 35000 },
    ]))

    // أدوات صحية
    products.push(await createProduct('صابون مرطب 125 غ', 'HY001', '6281001000017', c5.id, 800, 1200, [
      { name: 'قطعة', factor: 1, cost: 800, sell: 1200 },
      { name: 'كرتونة (48 قطعة)', factor: 48, cost: 38400, sell: 57600 },
    ]))
    products.push(await createProduct('شامبو 400 مل', 'HY002', '6281001000018', c5.id, 2500, 4000, [
      { name: 'عبوة', factor: 1, cost: 2500, sell: 4000 },
      { name: 'كرتونة (12 عبوة)', factor: 12, cost: 30000, sell: 48000 },
    ]))
    products.push(await createProduct('معجون أسنان 100 غ', 'HY003', '6281001000019', c5.id, 800, 1200, [
      { name: 'عبوة', factor: 1, cost: 800, sell: 1200 },
      { name: 'كرتونة (24 عبوة)', factor: 24, cost: 19200, sell: 28800 },
      { name: 'كرتونة كبيرة (144 عبوة)', factor: 144, cost: 115200, sell: 172800 },
    ]))
    products.push(await createProduct('مناديل ورقية 200 ورقة', 'HY004', '6281001000020', c5.id, 600, 900, [
      { name: 'رزمة', factor: 1, cost: 600, sell: 900 },
      { name: 'كرتونة (48 رزمة)', factor: 48, cost: 28800, sell: 43200 },
    ]))

    // ==================== Create Warehouse Stock ====================
    for (const p of products) {
      for (const u of p.units) {
        await db.warehouseStock.create({
          data: {
            warehouseId: w1.id,
            productId: p.id,
            unitId: u.id,
            quantity: u.isDefault ? Math.floor(Math.random() * 200 + 20) : Math.floor(Math.random() * 30 + 5),
            minStock: u.isDefault ? 10 : 3,
          },
        })
        // 50% chance to also stock in second warehouse
        if (Math.random() > 0.5) {
          await db.warehouseStock.create({
            data: {
              warehouseId: w2.id,
              productId: p.id,
              unitId: u.id,
              quantity: u.isDefault ? Math.floor(Math.random() * 100 + 10) : Math.floor(Math.random() * 15 + 2),
              minStock: u.isDefault ? 5 : 2,
            },
          })
        }
      }
    }

    // Create some low stock items (quantity <= minStock)
    for (let i = 0; i < 4; i++) {
      const p = products[i]
      const defaultUnit = p.units.find((u: any) => u.isDefault)
      if (defaultUnit) {
        await db.warehouseStock.updateMany({
          where: { productId: p.id, unitId: defaultUnit.id, warehouseId: w1.id },
          data: { quantity: Math.floor(Math.random() * 5) },
        })
      }
    }

    // ==================== Create Customers (Arabic names) ====================
    const cust1 = await db.customer.create({ data: { name: 'محمد أحمد السعيد', phone: '0951234567', address: 'دمشق - المهاجرين' } })
    const cust2 = await db.customer.create({ data: { name: 'فاطمة علي حسن', phone: '0967654321', address: 'حلب - السريان' } })
    const cust3 = await db.customer.create({ data: { name: 'حسام خالد العلي', phone: '0944556677', address: 'حمص - النزهة' } })
    const cust4 = await db.customer.create({ data: { name: 'سارة يوسف إبراهيم', phone: '0933889900', address: 'اللاذقية - شارع المتنبي' } })
    const cust5 = await db.customer.create({ data: { name: 'عبد الرحمن مصطفى', phone: '0922112233', address: 'طرطوس - الحي الأدبي' } })

    // ==================== Create Suppliers (Arabic names) ====================
    const sup1 = await db.supplier.create({ data: { name: 'شركة الأمل للتجارة', phone: '011-2223333', address: 'دمشق - برزة' } })
    const sup2 = await db.supplier.create({ data: { name: 'مؤسسة النور للأجهزة', phone: '021-4445555', address: 'حلب - الشعار' } })
    const sup3 = await db.supplier.create({ data: { name: 'شركة البركة للغذائية', phone: '031-6667777', address: 'حمص - الحميدية' } })
    const sup4 = await db.supplier.create({ data: { name: 'مستودع السعادة', phone: '041-8889900', address: 'اللاذقية - الميناء' } })
    const sup5 = await db.supplier.create({ data: { name: 'شركة الجودة للتوريدات', phone: '013-1122334', address: 'دير الزور - الكورنيش' } })

    // ==================== Create Sample Invoices (mix of sale/purchase) ====================
    const invoiceData = [
      { type: 'sale', customerId: cust1.id, warehouseId: w1.id, productIdx: [0, 1, 7], qty: [2, 5, 3], status: 'confirmed', daysAgo: 0 },
      { type: 'sale', customerId: cust2.id, warehouseId: w1.id, productIdx: [9, 14, 17], qty: [1, 3, 10], status: 'confirmed', daysAgo: 0 },
      { type: 'purchase', supplierId: sup1.id, warehouseId: w1.id, productIdx: [0, 1, 2], qty: [50, 100, 200], status: 'confirmed', daysAgo: 1 },
      { type: 'sale', customerId: cust3.id, warehouseId: w1.id, productIdx: [4, 10, 12], qty: [1, 5, 20], status: 'confirmed', daysAgo: 2 },
      { type: 'sale', customerId: cust4.id, warehouseId: w2.id, productIdx: [5, 13, 18], qty: [2, 4, 8], status: 'confirmed', daysAgo: 3 },
      { type: 'purchase', supplierId: sup2.id, warehouseId: w2.id, productIdx: [3, 6, 7], qty: [40, 30, 60], status: 'confirmed', daysAgo: 4 },
      { type: 'sale', customerId: cust5.id, warehouseId: w1.id, productIdx: [8, 11, 19], qty: [3, 10, 6], status: 'confirmed', daysAgo: 5 },
      { type: 'purchase', supplierId: sup3.id, warehouseId: w1.id, productIdx: [9, 10, 11], qty: [100, 50, 200], status: 'confirmed', daysAgo: 6 },
      { type: 'sale', customerId: cust1.id, warehouseId: w1.id, productIdx: [15, 16, 17], qty: [5, 3, 4], status: 'confirmed', daysAgo: 7 },
      { type: 'purchase', supplierId: sup4.id, warehouseId: w1.id, productIdx: [12, 13, 14], qty: [500, 200, 300], status: 'confirmed', daysAgo: 8 },
    ]

    for (let idx = 0; idx < invoiceData.length; idx++) {
      const inv = invoiceData[idx]
      const prefix = inv.type === 'sale' ? 'SL' : inv.type === 'purchase' ? 'PU' : inv.type === 'sale_return' ? 'SR' : 'PR'
      const invoiceNo = `${prefix}-${String(idx + 1).padStart(3, '0')}`

      const items = inv.productIdx.map((pIdx, i) => {
        const p = products[pIdx]
        const u = p.units[0] // default unit
        const qty = inv.qty[i]
        const itemTotal = qty * u.sellPrice
        return {
          productId: p.id,
          unitId: u.id,
          productName: p.name,
          unitName: u.name,
          quantity: qty,
          price: u.sellPrice,
          total: itemTotal,
          costPrice: u.costPrice,
        }
      })

      const subtotal = items.reduce((s: number, item: any) => s + item.total, 0)
      const total = subtotal
      const paid = (inv.type === 'sale' || inv.type === 'sale_return')
        ? Math.floor(total * 0.7)
        : total

      const date = new Date()
      date.setDate(date.getDate() - inv.daysAgo)

      await db.invoice.create({
        data: {
          type: inv.type,
          invoiceNo,
          customerId: (inv as any).customerId || null,
          supplierId: (inv as any).supplierId || null,
          warehouseId: inv.warehouseId,
          date,
          subtotal,
          discount: 0,
          tax: 0,
          total,
          paidAmount: paid,
          status: inv.status,
          createdById: admin.id,
          notes: null,
          items: { create: items },
        },
      })

      // Update customer/supplier balance
      if ((inv as any).customerId && (inv.type === 'sale' || inv.type === 'sale_return')) {
        const balanceAdj = inv.type === 'sale' ? total - paid : -(total - paid)
        await db.customer.update({
          where: { id: (inv as any).customerId },
          data: { balance: { increment: balanceAdj } },
        })
      }
      if ((inv as any).supplierId && (inv.type === 'purchase' || inv.type === 'purchase_return')) {
        const balanceAdj = inv.type === 'purchase' ? total - paid : -(total - paid)
        await db.supplier.update({
          where: { id: (inv as any).supplierId },
          data: { balance: { increment: balanceAdj } },
        })
      }

      // Create payment record
      if (paid > 0) {
        await db.payment.create({
          data: {
            invoiceId: (await db.invoice.findFirst({ where: { invoiceNo }, select: { id: true } }))!.id,
            customerId: (inv as any).customerId || null,
            supplierId: (inv as any).supplierId || null,
            amount: paid,
            method: 'cash',
            date,
            notes: `دفعة على فاتورة ${invoiceNo}`,
          },
        })
      }
    }

    // ==================== Create Sample Vouchers ====================
    const voucherData = [
      { type: 'receipt', customerId: cust1.id, amount: 500000, method: 'cash', description: 'دفعة على فاتورة بيع', daysAgo: 0 },
      { type: 'receipt', customerId: cust3.id, amount: 250000, method: 'cash', description: 'تسديد رصيد مستحق', daysAgo: 1 },
      { type: 'receipt', customerId: cust2.id, amount: 750000, method: 'transfer', description: 'تحويل بنكي', daysAgo: 2 },
      { type: 'payment', supplierId: sup1.id, amount: 1200000, method: 'cash', description: 'دفعة على فاتورة شراء', daysAgo: 0 },
      { type: 'payment', supplierId: sup2.id, amount: 600000, method: 'transfer', description: 'تسديد مستحقات', daysAgo: 3 },
      { type: 'payment', supplierId: sup3.id, amount: 400000, method: 'cash', description: 'دفعة جزئية', daysAgo: 5 },
    ]

    for (let idx = 0; idx < voucherData.length; idx++) {
      const v = voucherData[idx]
      const prefix = v.type === 'receipt' ? 'RCP' : 'PAY'
      const voucherNo = `${prefix}-${String(idx + 1).padStart(4, '0')}`
      const date = new Date()
      date.setDate(date.getDate() - v.daysAgo)

      await db.voucher.create({
        data: {
          voucherNo,
          type: v.type,
          customerId: (v as any).customerId || null,
          supplierId: (v as any).supplierId || null,
          amount: v.amount,
          method: v.method,
          description: v.description,
          date,
          createdById: admin.id,
        },
      })

      // Update balances
      if ((v as any).customerId && v.type === 'receipt') {
        await db.customer.update({
          where: { id: (v as any).customerId },
          data: { balance: { decrement: v.amount } },
        })
      }
      if ((v as any).supplierId && v.type === 'payment') {
        await db.supplier.update({
          where: { id: (v as any).supplierId },
          data: { balance: { decrement: v.amount } },
        })
      }
    }

    // ==================== Create Sample Expenses ====================
    const expenseData = [
      { amount: 500000, category: 'إيجار', description: 'إيجار المحل - شهر نيسان', daysAgo: 0 },
      { amount: 150000, category: 'مرافق', description: 'فاتورة كهرباء', daysAgo: 1 },
      { amount: 80000, category: 'مرافق', description: 'فاتورة ماء', daysAgo: 2 },
      { amount: 2000000, category: 'رواتب', description: 'رواتب الموظفين', daysAgo: 0 },
      { amount: 75000, category: 'نقل', description: 'أجور نقل بضائع', daysAgo: 3 },
      { amount: 120000, category: 'صيانة', description: 'صيانة المولد الكهربائي', daysAgo: 4 },
      { amount: 30000, category: 'أخرى', description: 'قرطاسية ومستلزمات مكتبية', daysAgo: 5 },
    ]

    for (let idx = 0; idx < expenseData.length; idx++) {
      const e = expenseData[idx]
      const expenseNo = `EXP-${String(idx + 1).padStart(4, '0')}`
      const date = new Date()
      date.setDate(date.getDate() - e.daysAgo)

      await db.expense.create({
        data: {
          expenseNo,
          amount: e.amount,
          category: e.category,
          description: e.description,
          date,
          createdById: admin.id,
        },
      })
    }

    return NextResponse.json({
      message: 'تم إنشاء البيانات التجريبية بنجاح',
      stats: {
        users: 1,
        warehouses: 2,
        categories: 5,
        products: products.length,
        customers: 5,
        suppliers: 5,
        invoices: invoiceData.length,
        vouchers: voucherData.length,
        expenses: expenseData.length,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في إنشاء البيانات' }, { status: 500 })
  }
}
