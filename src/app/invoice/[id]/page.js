'use client';


import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { generateInvoiceQR } from '@/lib/qr';
import ShareButtons from '@/components/ShareButtons';
import Barcode from '@/components/Barcode';
import { printThermal, printA4 } from '@/lib/print';
import { toHijri } from '@/lib/hijri';

export default function InvoicePage() {
  const params = useParams();
  const id = params?.id;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase.from('orders').select('*').eq('id', id).single();
      setOrder(data);
      setLoading(false);
    }
    load();
  }, [id]);

  function printInvoice() { window.print(); }

  if (loading) {
    return (
      <div className="ol-empty-state" style={{ padding: 80 }}>
        <span className="em">⏳</span>
        <p>جارٍ التحميل...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="ol-empty-state" style={{ padding: 80 }}>
        <span className="em">🔍</span>
        <p>الفاتورة غير موجودة</p>
        <Link href="/" className="merchant-empty-btn" style={{ marginTop: 16 }}>الرئيسية</Link>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const date = new Date(order.created_at).toLocaleString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <>
      <div className="invoice-wrap" id="invoice-capture-area">
        <div className="invoice-header">
          <div className="invoice-brand">
            <div className="invoice-brand-mark">س</div>
            <div>
              <div className="invoice-brand-name">سند</div>
              <div className="invoice-brand-sub">فاتورة ضريبية مبسطة</div>
            </div>
          </div>
          <div className="invoice-meta">
            <div><strong>INV</strong> #{order.order_code}</div>
            <div>{date}</div>
            <div style={{ color: '#0e8a66', fontWeight: 700, fontSize: 11 }}>🌙 {toHijri(new Date(order.created_at))}</div>
            <div style={{ color: '#16a34a', fontWeight: 800 }}>مدفوعة</div>
          </div>
        </div>

        <div className="invoice-customer">
          <div className="invoice-customer-row"><strong>التاجر:</strong> {order.provider_name}</div>
          <div className="invoice-customer-row"><strong>العميل:</strong> {order.customer_name}</div>
          <div className="invoice-customer-row"><strong>الهاتف:</strong> <span style={{ direction:'ltr', display:'inline-block' }}>{order.customer_phone}</span></div>
          {order.customer_address && (
            <div className="invoice-customer-row"><strong>العنوان:</strong> {order.customer_address}</div>
          )}
        </div>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>المنتج</th>
              <th style={{ textAlign:'center' }}>الكمية</th>
              <th style={{ textAlign:'left' }}>السعر</th>
              <th style={{ textAlign:'left' }}>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>{it.title}</td>
                <td style={{ textAlign:'center' }}>{it.qty}</td>
                <td style={{ direction:'ltr' }}>{Number(it.price).toLocaleString()}</td>
                <td style={{ direction:'ltr' }}>{(Number(it.price) * it.qty).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-totals">
          <div className="invoice-total-row">
            <span>المجموع الفرعي</span>
            <span>{Number(order.subtotal || 0).toLocaleString()} {order.currency}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="invoice-total-row">
              <span>الخصم</span>
              <span style={{ color:'#16a34a' }}>− {Number(order.discount).toLocaleString()} {order.currency}</span>
            </div>
          )}
          <div className="invoice-total-row grand">
            <span>المجموع النهائي</span>
            <span>{Number(order.total || 0).toLocaleString()} {order.currency}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <div className="qr-display">
            <img src={generateInvoiceQR(order.order_code, order.total, order.currency)} alt="QR" width="140" height="140" />
          </div>
          <div className="qr-caption">امسح للتحقق من الفاتورة</div>
        </div>

        <div style={{ textAlign: 'center', margin: '20px 0 8px' }}>
          <Barcode value={order.order_code} width={220} height={50} />
        </div>

        <div style={{ textAlign: 'center', fontSize: 11.5, color: '#666', marginBottom: 16, fontWeight: 700 }}>
          🌙 {toHijri(new Date(order.created_at))}
        </div>

        <div className="invoice-thanks">
          شكراً لتعاملكم معنا — سند | خدماتك أقرب
        </div>
      </div>

      <div style={{ padding: '0 20px' }} className="no-print">
        <ShareButtons title={`فاتورة ${order.order_code} من سند`} captureId="invoice-capture-area" />
      </div>

      <div className="invoice-actions no-print">
        <button className="invoice-action primary" onClick={() => printA4('invoice-print-area', 'فاتورة')} type="button">🖨️ A4 / PDF</button>
        <button className="invoice-action primary" onClick={() => printThermal('invoice-print-area', { width: '80mm', title: 'فاتورة' })} type="button" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>🧾 80mm</button>
        <Link href="/" className="invoice-action ghost">
          الرئيسية
        </Link>
      </div>
    </>
  );
}
