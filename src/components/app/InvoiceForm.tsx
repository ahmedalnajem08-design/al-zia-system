'use client'

import type { InvoiceType } from '@/lib/types'

interface InvoiceFormProps {
  type: InvoiceType
}

export default function InvoiceForm({ type }: InvoiceFormProps) {
  const labels: Record<InvoiceType, string> = {
    sale: 'فاتورة بيع',
    purchase: 'فاتورة شراء',
    sale_return: 'إرجاع بيع',
    purchase_return: 'إرجاع شراء',
  }
  return <div className="p-6"><h1 className="text-2xl font-bold">{labels[type]}</h1></div>
}
