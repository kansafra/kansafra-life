'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function ProductsList() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    let stored = null;
    try {
      const raw = localStorage.getItem('sanad_entity');
      if (raw) stored = JSON.parse(raw);
    } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('provider_name', ent.display_name)
        .order('created_at', { ascending: false });
      if (Array.isArray(data)) setProducts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (p.title || '').toLowerCase().includes(q)
      || (p.description || '').toLowerCase().includes(q);
  });

  const calcFinal = (p) => {
    const price = Number(p.price) || 0;
    const disc = Number(p.discount_percent) || 0;
    return Math.round(price - (price * disc / 100));
  };

  async function confirmDelete() {
    if (!deleting) return;
    const { error: err } = await supabase.from('products').delete().eq('id', deleting.id);
    if (err) { alert('تعذّر الحذف'); return; }
    setProducts((arr) => arr.filter((x) => x.id !== deleting.id));
    setDeleting(null);
  }

  function exportCSV() {
    if (!filtered.length) { alert('لا توجد منتجات للتصدير'); return; }
    const rows = [
      ['الاسم', 'السعر', 'الخصم%', 'السعر النهائي', 'العملة', 'الكمية', 'الوحدة', 'الفئة', 'الوصف'],
      ...filtered.map((p) => [
        (p.title || '').replace(/,/g, ' '),
        Number(p.price || 0),
        Number(p.discount_percent || 0),
        calcFinal(p),
        p.currency || 'SYP',
        Number(p.stock || 0),
        p.unit || 'قطعة',
        p.category || 'other',
        (p.description || '').replace(/,/g, ' ').replace(/\n/g, ' '),
      ]),
    ];
    const csv = '\uFEFF' + rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="prod-page">
      <header className="prod-header">
        <Link href="/merchant" className="prod-back">→</Link>
        <span className="prod-header-title">المنتجات</span>
        <Link href="/merchant/products/new" className="prod-add-btn">+ جديد</Link>
      </header>

      <div style={{ padding: '16px 20px 0' }}>
        <input
          className="new-service-input"
          type="text"
          placeholder="ابحث يوجد منتجاتك..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="prod-toolbar">
        <button className="prod-export-btn" onClick={exportCSV} type="button">
          📊 تصدير CSV
        </button>
        <span className="prod-export-btn secondary" style={{ pointerEvents: 'none' }}>
          {filtered.length} منتج
        </span>
      </div>

      {loading ? (
        <div className="ol-empty-state" style={{ padding: 60 }}>
          <span className="em">⏳</span>
          <p>جارٍ التحميل...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '40px 20px' }}>
          <div className="merchant-empty">
            <span className="em">📦</span>
            <h3>لا توجد منتجات</h3>
            <p>أضف منتجك الأول ليظهر للزوار بأسعاره وصوره</p>
            <Link href="/merchant/products/new" className="merchant-empty-btn">
              + إضافة منتج
            </Link>
          </div>
        </div>
      ) : (
        <div className="prod-grid">
          {filtered.map((p) => {
            const finalPrice = calcFinal(p);
            const hasDiscount = Number(p.discount_percent) > 0;
            const inStock = Number(p.stock) > 0;
            return (
              <div key={p.id} className="prod-card">
                <div className="prod-actions">
                  <Link href={`/merchant/products/${p.id}/edit`} className="prod-action-btn edit" aria-label="تعديل">✏️</Link>
                  <button className="prod-action-btn del" type="button" onClick={() => setDeleting(p)} aria-label="حذف">🗑️</button>
                </div>
                <div className="prod-img-wrap">
                  {hasDiscount && (
                    <span className="prod-discount-badge">-{p.discount_percent}%</span>
                  )}
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} loading="lazy" />
                  ) : (
                    <div className="prod-img-placeholder">📦</div>
                  )}
                </div>
                <div className="prod-body">
                  <div className="prod-name">{p.title}</div>
                  <div className="prod-price-row">
                    <span className="prod-price">{finalPrice.toLocaleString()}</span>
                    {hasDiscount && (
                      <span className="prod-price-old">{Number(p.price).toLocaleString()}</span>
                    )}
                    <span className="prod-currency">{p.currency || 'ل.س'}</span>
                  </div>
                  <div className={`prod-stock ${inStock ? 'in' : 'out'}`}>
                    {inStock ? `✓ متوفر (${p.stock})` : '✗ غير متوفر'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleting && (
        <div className="prod-modal-bg" onClick={() => setDeleting(null)}>
          <div className="prod-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prod-modal-icon">🗑️</div>
            <h3>حذف المنتج؟</h3>
            <p>سيتم حذف "{deleting.title}" نهائياً</p>
            <div className="prod-modal-actions">
              <button className="cancel" onClick={() => setDeleting(null)}>إلغاء</button>
              <button className="confirm" onClick={confirmDelete}>حذف نهائي</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
