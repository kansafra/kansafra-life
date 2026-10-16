'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function InventoryPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState(null);
  const [adjustQty, setAdjustQty] = useState('0');
  const [adjustType, setAdjustType] = useState('in');

  useEffect(() => {
    let stored = null;
    try { stored = getSession(); } catch (e) {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) return;
    const { data } = await supabase
      .from('products')
      .select('id,title,stock,unit,price')
      .eq('provider_name', ent.display_name)
      .order('title');
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function adjust() {
    if (!adjusting || !adjustQty) return;
    const delta = adjustType === 'in' ? Number(adjustQty) : adjustType === 'out' ? -Number(adjustQty) : Number(adjustQty);
    const newStock = Math.max(0, (Number(adjusting.stock) || 0) + delta);
    await supabase.from('products').update({ stock: newStock }).eq('id', adjusting.id);
    setProducts((arr) => arr.map((p) => p.id === adjusting.id ? { ...p, stock: newStock } : p));
    setAdjusting(null);
    setAdjustQty('0');
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  const lowStock = products.filter((p) => Number(p.stock) <= 5);

  return (
    <div className="mng-page">
      <div className="mng-header">
        <Link href="/merchant" className="mng-back">→</Link>
        <span className="mng-title">📊 المخزون</span>
        <span className="mng-count">{products.length}</span>
      </div>

      {lowStock.length > 0 && (
        <div style={{ margin: '14px 20px 0', padding: 14, background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 14, fontSize: 12.5, color: '#dc2626', fontWeight: 700 }}>
          ⚠️ {lowStock.length} منتج بمخزون منخفض — يحتاج تعبئة
        </div>
      )}

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : products.length === 0 ? (
        <div className="sect-empty"><span className="em">📦</span><p>لا توجد منتجات</p></div>
      ) : (
        <div style={{ padding: '14px 20px 30px' }}>
          {products.map((p) => {
            const st = Number(p.stock) || 0;
            const type = st === 0 ? 'out' : st <= 5 ? 'adjust' : 'in';
            return (
              <div key={p.id} className={`inv-move ${type}`}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--n-900)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--n-500)', fontWeight: 600 }}>
                    {st === 0 ? 'نفد المخزون' : st <= 5 ? 'مخزون منخفض' : 'متوفر'}
                  </div>
                </div>
                <div className="qty">{st}</div>
                <div style={{ fontSize: 10.5, color: 'var(--n-500)', fontWeight: 700 }}>{p.unit || 'قطعة'}</div>
                <button
                  onClick={() => { setAdjusting(p); setAdjustQty('0'); setAdjustType('in'); }}
                  type="button"
                  style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--f-50)', border: 'none', color: 'var(--f-700)', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}
                >
                  تعديل
                </button>
              </div>
            );
          })}
        </div>
      )}

      {adjusting && (
        <div className="mng-modal-bg" onClick={() => setAdjusting(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">📊 تعديل المخزون</h3>
            <div style={{ background: 'var(--c-50)', padding: 12, borderRadius: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--n-900)' }}>{adjusting.title}</div>
              <div style={{ fontSize: 12, color: 'var(--n-500)', marginTop: 4 }}>المخزون الحالي: {adjusting.stock} {adjusting.unit || 'قطعة'}</div>
            </div>
            <div className="new-service-field">
              <label className="new-service-label">نوع الحركة</label>
              <select className="new-service-select" value={adjustType} onChange={(e) => setAdjustType(e.target.value)}>
                <option value="in">+ إضافة (وارد)</option>
                <option value="out">− خصم (صادر)</option>
                <option value="set">= ضبط المخزون</option>
              </select>
            </div>
            <div className="new-service-field">
              <label className="new-service-label">الكمية</label>
              <input className="new-service-input" type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
            </div>
            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setAdjusting(null)} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={adjust} type="button">✓ حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
