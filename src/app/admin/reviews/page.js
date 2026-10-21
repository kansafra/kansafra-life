'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'pending', label: '⏳ معلقة' },
  { key: 'approved', label: '✅ مقبولة' },
  { key: 'rejected', label: '❌ مرفوضة' },
];

const STAR_FILTERS = [
  { key: 0, label: 'كل النجوم' },
  { key: 5, label: '⭐⭐⭐⭐⭐' },
  { key: 4, label: '⭐⭐⭐⭐' },
  { key: 3, label: '⭐⭐⭐' },
  { key: 2, label: '⭐⭐' },
  { key: 1, label: '⭐' },
];

export default function AdminReviewsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState({});
  const [entities, setEntities] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [starFilter, setStarFilter] = useState(0);
  const [search, setSearch] = useState('');
  const [working, setWorking] = useState(null);

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!admin) { router.replace('/admin/login'); return; }
    loadReviews();
  }, [router]);

  async function loadReviews() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: revs } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      setReviews(revs || []);

      // جلب المنتجات والمتاجر للعرض
      const productIds = [...new Set((revs || []).map(r => r.product_id).filter(Boolean))];
      const entityIds = [...new Set((revs || []).map(r => r.entity_id).filter(Boolean))];

      if (productIds.length > 0) {
        const { data: prods } = await supabase.from('products').select('id, title').in('id', productIds);
        const map = {};
        (prods || []).forEach(p => { map[p.id] = p.title; });
        setProducts(map);
      }

      if (entityIds.length > 0) {
        const { data: ents } = await supabase.from('entities').select('id, display_name').in('id', entityIds);
        const map = {};
        (ents || []).forEach(e => { map[e.id] = e.display_name; });
        setEntities(map);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function updateStatus(rev, status) {
    setWorking(rev.id);
    try {
      const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
      const { error } = await supabase.from('reviews').update({
        status,
        moderated_at: new Date().toISOString(),
        moderated_by: admin?.username || 'admin',
      }).eq('id', rev.id);

      if (error) throw error;
      success(status === 'approved' ? '✅ تم القبول' : '❌ تم الرفض');
      setReviews(prev => prev.map(r => r.id === rev.id ? { ...r, status } : r));
    } catch (err) {
      console.error(err);
      toastError('فشل التحديث');
    } finally {
      setWorking(null);
    }
  }

  async function handleDelete(rev) {
    if (!confirm('حذف هذا التقييم نهائياً؟')) return;
    setWorking(rev.id);
    const { error } = await supabase.from('reviews').delete().eq('id', rev.id);
    if (!error) { success('🗑️ تم الحذف'); setReviews(prev => prev.filter(r => r.id !== rev.id)); }
    else toastError('فشل الحذف');
    setWorking(null);
  }

  const stats = useMemo(() => ({
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending' || !r.status).length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
    avgRating: reviews.length > 0
      ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
      : 0,
  }), [reviews]);

  const filtered = useMemo(() => {
    let list = reviews;
    if (filter === 'pending') list = list.filter(r => r.status === 'pending' || !r.status);
    if (filter === 'approved') list = list.filter(r => r.status === 'approved');
    if (filter === 'rejected') list = list.filter(r => r.status === 'rejected');
    if (starFilter > 0) list = list.filter(r => Number(r.rating) === starFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r =>
        (r.customer_name || '').toLowerCase().includes(q) ||
        (r.comment || '').toLowerCase().includes(q) ||
        (products[r.product_id] || '').toLowerCase().includes(q) ||
        (entities[r.entity_id] || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [reviews, filter, starFilter, search, products, entities]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>⭐ التقييمات</h1>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>{stats.total}</div>
        </div>
        <input
          type="search"
          placeholder="🔍 ابحث بالاسم، النص، المتجر..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)', marginBottom: 12 }}
        />
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              background: filter === f.key ? '#fff' : 'rgba(255,255,255,0.1)',
              color: filter === f.key ? '#0f172a' : '#fff',
              border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 900,
              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit'
            }}>
              {f.label} {f.key === 'pending' && stats.pending > 0 && `(${stats.pending})`}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {STAR_FILTERS.map(s => (
            <button key={s.key} onClick={() => setStarFilter(s.key)} style={{
              background: starFilter === s.key ? '#fbbf24' : 'rgba(255,255,255,0.1)',
              color: starFilter === s.key ? '#0f172a' : '#fff',
              border: 'none', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 900,
              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit'
            }}>{s.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f172a" />
          <StatBox label="معلقة" value={stats.pending} color="#f59e0b" />
          <StatBox label="مقبولة" value={stats.approved} color="#10b981" />
          <StatBox label="متوسط" value={`${stats.avgRating} ⭐`} color="#fbbf24" />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>{reviews.length === 0 ? 'لا توجد تقييمات بعد' : 'لا نتائج مطابقة'}</div>
          </div>
        ) : filtered.map(rev => {
          const rating = Number(rev.rating || 0);
          const productName = products[rev.product_id];
          const entityName = entities[rev.entity_id];
          const isWorking = working === rev.id;
          const status = rev.status || 'pending';

          const statusColors = {
            pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: '⏳ معلق' },
            approved: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: '✅ مقبول' },
            rejected: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: '❌ مرفوض' },
          };
          const sc = statusColors[status] || statusColors.pending;

          return (
            <div key={rev.id} style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e2e8f0', opacity: isWorking ? 0.6 : 1 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>👤 {rev.customer_name || 'مستخدم'}</div>
                    <div style={{ background: sc.bg, color: sc.color, padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900 }}>{sc.label}</div>
                  </div>
                  <div style={{ fontSize: 14, color: '#fbbf24', letterSpacing: 2, marginBottom: 4 }}>
                    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                  </div>
                  {entityName && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>🏪 {entityName}</div>}
                  {productName && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📦 {productName}</div>}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap', textAlign: 'left' }}>
                  {rev.created_at ? new Date(rev.created_at).toLocaleDateString('ar-SY') : ''}
                </div>
              </div>

              {rev.comment && (
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 12 }}>
                  "{rev.comment}"
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {status !== 'approved' && (
                  <button onClick={() => updateStatus(rev, 'approved')} disabled={isWorking} style={btnStyle('#10b981', '#fff')}>
                    ✓ قبول
                  </button>
                )}
                {status !== 'rejected' && (
                  <button onClick={() => updateStatus(rev, 'rejected')} disabled={isWorking} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>
                    ❌ رفض
                  </button>
                )}
                <button onClick={() => handleDelete(rev)} disabled={isWorking} style={btnStyle('rgba(148,163,184,0.15)', '#64748b')}>
                  {isWorking ? '⏳' : '🗑️ حذف'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 15, fontWeight: 900, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div>
    </div>
  );
}

const btnStyle = (bg, color) => ({ flex: 1, padding: 10, background: bg, color, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
