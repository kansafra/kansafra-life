'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import InvoiceForm from '@/components/InvoiceForm';

export default function NewInvoicePage() {
  const router = useRouter();
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>🧾 فاتورة جديدة</h1>
      </div>
      <InvoiceForm />
    </div>
  );
}
