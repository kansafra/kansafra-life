'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function AdminCleanupPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [entities, setEntities] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!admin) { router.replace('/admin/login'); return; }
    loadData();
  }, [router]);

  async function loadData() {
    if (!supabase) return;
    setLoading(true);
    try {
      const [ents, prods, ords] = await Promise.all([
        supabase.from('entities').select('*'),
        supabase.from('products').select('id, entity_id'),
        supabase.from('orders').select('id, entity_id'),
      ]);
      setEntities(ents.data || []);
      setProducts(prods.data || []);
      setOrders(ords.data || []);
    } catch (err) {
      console.error(err);
      toastError('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }

  // حساب المتاجر التي ليس لها منتجات ولا طلبات أو تبدأ بـ "سند |"
  const emptyEntities = useMemo(() => {
    const productCount = {};
    products.forEach(p => { if (p.entity_id) productCount[p.entity_id] = (productCount[p.entity_id] || 0) + 1; });
    const orderCount = {};
    orders.forEach(o => { if (o.entity_id) orderCount[o.entity_id] = (orderCount[o.entity_id] || 0) + 1; });

    return entities.map(e => ({
      ...e,
      _productCount: productCount[e.id] || 0,
      _orderCount: orderCount[e.id] || 0,
      _isPlaceholder: e.display_name?.startsWith('سند |'),
      _isEmpty: !productCount[e.id] && !orderCount[e.id],
    })).filter(e => e._isEmpty || e._isPlaceholder);
  }, [entities, products, orders]);

  async function handleBulkHide() {
    if (selected.length === 0) { toastError('اختر متجراً واحداً على الأقل'); return; }
    if (!confirm(`إخفاء ${selected.length} متجر؟ (لن تُحذف بياناتهم، لكن لن تظهر للزوار)`)) return;

    setWorking(true);
    try {
      const { error } = await supabase.from('entities').update({ is_active: false, approval_status: 'rejected' }).in('id', selected);
      if (error) throw error;
      success(`✅ تم إخفاء ${selected.length} متجر`);
      setSelected([]);
      loadData();
    } catch (err) {
      toastError('فشل الإخفاء');
    } finally { setWorking(false); }
  }

  async function handleBulkDelete() {
    if (selected.length === 0) { toastError('اختر متجراً واحداً على الأقل'); return; }
    if (prompt(`⚠️ حذف ${selected.length} متجر نهائياً؟ اكتب "حذف" للتأكيد:`) !== 'حذف') {
      toastError('تم الإلغاء'); return;
    }

    setWorking(true);
    try {
      const { error } = await supabase.from('entities').delete().in('id', selected);
      if (error) throw error;
      success(`🗑️ تم حذف ${selected.length} متجر`);
      setSelected([]);
      loadData();
    } catch (err) {
      toastError('فشل الحذف — قد تكون هناك بيانات مرتبطة (منتجات، طلبات)');
    } finally { setWorking(false); }
  }

  function toggleSelect(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function selectAll() {
    if (selected.length === emptyEntities.length) setSelected([]);
    else setSelected(emptyEntities.map(e => e.id));
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 120 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>🧹 تنظيف المتاجر</h1>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
            {emptyEntities.length}
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: '8px 0 0' }}>
          المتاجر الفارغة (لا منتجات، لا طلبات) أو الوهمية (تبدأ بـ "سند |")
        </p>
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        {emptyEntities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 6 }}>رائع!</div>
            <div style={{ fontSize: 12 }}>لا توجد متاجر فارغة أو وهمية</div>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.length === emptyEntities.length && emptyEntities.length > 0} onChange={selectAll} style={{ width: 18, height: 18 }} />
                <span style={{ fontSize: 13, fontWeight: 900 }}>تحديد الكل ({emptyEntities.length})</span>
              </label>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800 }}>
                محدد: {selected.length}
              </div>
            </div>

            {/* List */}
            {emptyEntities.map(e => (
              <div key={e.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: selected.includes(e.id) ? '2px solid #10b981' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggleSelect(e.id)} style={{ width: 18, height: 18, flexShrink: 0 }} />
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {e.logo_url ? <img src={e.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} /> : '🏪'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.display_name}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, display: 'flex', gap: 8 }}>
                    <span>📦 {e._productCount} منتج</span>
                    <span>🛒 {e._orderCount} طلب</span>
                    {e._isPlaceholder && <span style={{ color: '#f59e0b' }}>⚠️ وهمي</span>}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800 }}>
                  {e.approval_status === 'approved' ? '✅' : e.approval_status === 'rejected' ? '❌' : '⏳'}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Action Bar */}
      {emptyEntities.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', display: 'flex', gap: 8, boxShadow: '0 -4px 15px rgba(0,0,0,0.05)', zIndex: 30 }}>
          <button onClick={handleBulkHide} disabled={selected.length === 0 || working} style={{ flex: 1, padding: 14, background: selected.length === 0 ? '#f1f5f9' : 'rgba(245,158,11,0.15)', color: selected.length === 0 ? '#94a3b8' : '#f59e0b', border: selected.length === 0 ? '1px solid #e2e8f0' : '1px solid rgba(245,158,11,0.3)', borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: (selected.length === 0 || working) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {working ? '⏳' : `🙈 إخفاء (${selected.length})`}
          </button>
          <button onClick={handleBulkDelete} disabled={selected.length === 0 || working} style={{ flex: 1, padding: 14, background: selected.length === 0 ? '#f1f5f9' : 'rgba(239,68,68,0.15)', color: selected.length === 0 ? '#94a3b8' : '#ef4444', border: selected.length === 0 ? '1px solid #e2e8f0' : '1px solid rgba(239,68,68,0.3)', borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: (selected.length === 0 || working) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {working ? '⏳' : `🗑️ حذف (${selected.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
