'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'pending', label: 'قيد المراجعة' },
  { key: 'approved', label: 'مقبول' },
  { key: 'suspended', label: 'موقوف' },
];

const TYPE_LABELS = {
  merchant: '🏪 متجر', restaurant: '🍽️ مطعم', doctor: '👨‍⚕️ طبيب',
  pharmacy: '💊 صيدلية', school: '🏫 مدرسة', mosque: '🕌 جامع',
  charity: '🤝 جمعية', sports: '⚽ نادي', hotel: '🏨 فندق',
  office: '📁 مكتب', exchange: '💱 صرافة', transport: '🚗 مواصلات',
  memory: '📸 ذاكرة', municipality: '🏢 بلدية', craftsman: '🛠️ حرفي',
  workshop: '🏭 ورشة', isp: '📡 إنترنت', council: '🏛️ مجلس',
};

export default function AdminEntitiesPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [admin, setAdmin] = useState(null);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [working, setWorking] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!stored) { router.replace('/admin/login'); return; }
    setAdmin(stored);
    loadEntities();
  }, [router]);

  async function loadEntities() {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('entities').select('*').order('created_at', { ascending: false });
      setEntities(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const stats = useMemo(() => {
    const total = entities.length;
    const pending = entities.filter(e => e.approval_status === 'pending' || !e.approval_status).length;
    const approved = entities.filter(e => e.approval_status === 'approved' && e.is_active !== false).length;
    const suspended = entities.filter(e => e.approval_status === 'suspended' || e.is_active === false).length;
    return { total, pending, approved, suspended };
  }, [entities]);

  const filtered = useMemo(() => {
    let list = entities;
    if (filter === 'pending') list = list.filter(e => e.approval_status === 'pending' || !e.approval_status);
    else if (filter === 'approved') list = list.filter(e => e.approval_status === 'approved' && e.is_active !== false);
    else if (filter === 'suspended') list = list.filter(e => e.approval_status === 'suspended' || e.is_active === false);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(e => (e.display_name || '').toLowerCase().includes(q) || (e.phone || '').includes(q) || (e.city || '').toLowerCase().includes(q));
    }
    return list;
  }, [entities, filter, search]);

  async function updateEntity(entity, updates, successMsg) {
    setWorking(entity.id);
    const { error } = await supabase.from('entities').update(updates).eq('id', entity.id);
    if (error) toastError('فشل التحديث');
    else {
      success(successMsg);
      setEntities(prev => prev.map(e => e.id === entity.id ? { ...e, ...updates } : e));
    }
    setWorking(null);
  }

  const approve = (e) => updateEntity(e, { approval_status: 'approved', is_active: true }, '✅ تم قبول المتجر');
  const reject = (e) => {
    if (!confirm(`رفض متجر "${e.display_name}"؟`)) return;
    updateEntity(e, { approval_status: 'rejected', is_active: false }, '❌ تم الرفض');
  };
  const suspend = (e) => {
    if (!confirm(`إيقاف متجر "${e.display_name}" مؤقتاً؟`)) return;
    updateEntity(e, { approval_status: 'suspended', is_active: false }, '⏸️ تم الإيقاف');
  };
  const restore = (e) => updateEntity(e, { approval_status: 'approved', is_active: true }, '✅ تم الاسترجاع');

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>🏪 إدارة المتاجر</h1>
          <div style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '4px 10px', borderRadius: 8, fontWeight: 900 }}>{stats.total}</div>
        </div>
        <input type="search" placeholder="🔍 ابحث بالاسم أو الهاتف أو المدينة..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ background: filter === f.key ? '#fff' : 'rgba(255,255,255,0.1)', color: filter === f.key ? '#0f172a' : '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
              {f.label} {f.key === 'pending' && stats.pending > 0 && `(${stats.pending})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f172a" />
          <StatBox label="معلق" value={stats.pending} color="#f59e0b" />
          <StatBox label="مقبول" value={stats.approved} color="#10b981" />
          <StatBox label="موقوف" value={stats.suspended} color="#ef4444" />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>{entities.length === 0 ? 'لا توجد متاجر بعد' : 'لا توجد نتائج مطابقة'}</div>
          </div>
        ) : (
          filtered.map(entity => {
            const status = entity.approval_status || 'pending';
            const isActive = entity.is_active !== false;
            const isExpanded = expandedId === entity.id;
            const isWorking = working === entity.id;

            const statusMap = {
              pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: '⏳ قيد المراجعة' },
              approved: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: '✅ مقبول' },
              rejected: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: '❌ مرفوض' },
              suspended: { bg: 'rgba(148,163,184,0.15)', color: '#64748b', label: '⏸️ موقوف' },
            };
            const st = statusMap[status] || statusMap.pending;

            return (
              <div key={entity.id} style={{ background: '#fff', borderRadius: 16, marginBottom: 12, border: '1px solid #e2e8f0', overflow: 'hidden', opacity: isWorking ? 0.6 : 1 }}>
                <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => router.push(`/admin/entities/${entity.id}`)}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                    {entity.logo_url ? <img src={entity.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏪</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {entity.display_name || 'بدون اسم'}
                      {entity.is_verified && <span style={{ fontSize: 10, color: '#10b981' }}>✅</span>}
                      {!isActive && <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 900 }}>• مغلق</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {TYPE_LABELS[entity.entity_type] || entity.entity_type || 'نوع غير محدد'}
                      {entity.city && ` · ${entity.city}`}
                    </div>
                  </div>
                  <div style={{ background: st.bg, color: st.color, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap' }}>
                    {st.label}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
                      {entity.phone && <InfoRow label="📞 الهاتف" value={entity.phone} />}
                      {entity.whatsapp && <InfoRow label="💬 واتساب" value={entity.whatsapp} />}
                      {entity.address && <InfoRow label="📍 العنوان" value={entity.address} />}
                      {entity.owner_id && <InfoRow label="👤 Owner ID" value={entity.owner_id.slice(0, 12) + '...'} />}
                    </div>
                    {entity.description && (
                      <div style={{ fontSize: 11, color: '#475569', background: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 12, lineHeight: 1.6 }}>
                        {entity.description}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 12 }}>
                      تاريخ التسجيل: {entity.created_at ? new Date(entity.created_at).toLocaleDateString('ar-SY') : '—'}
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(status === 'pending' || status === 'rejected') && (
                        <button onClick={() => approve(entity)} disabled={isWorking} style={btnStyle('#10b981', '#fff')}>✓ قبول</button>
                      )}
                      {status === 'pending' && (
                        <button onClick={() => reject(entity)} disabled={isWorking} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>❌ رفض</button>
                      )}
                      {status === 'approved' && isActive && (
                        <button onClick={() => suspend(entity)} disabled={isWorking} style={btnStyle('rgba(245,158,11,0.1)', '#f59e0b')}>⏸️ إيقاف</button>
                      )}
                      {(status === 'suspended' || status === 'rejected' || !isActive) && (
                        <button onClick={() => restore(entity)} disabled={isWorking} style={btnStyle('#0f4d3a', '#fff')}>🔄 استرجاع</button>
                      )}
                      <Link href={`/store/${encodeURIComponent(entity.display_name || '')}`} target="_blank" style={{ ...btnStyle('rgba(14,165,233,0.1)', '#0284c7'), textDecoration: 'none', textAlign: 'center' }}>👁️ عرض</Link>
                      {entity.phone && (
                        <a href={`https://wa.me/${(entity.phone || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ ...btnStyle('rgba(37,211,102,0.1)', '#25D366'), textDecoration: 'none', textAlign: 'center' }}>💬 واتساب</a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 18, fontWeight: 900, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 8, padding: 8 }}>
      <div style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 800, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: '#1e293b', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}

const btnStyle = (bg, color) => ({ background: bg, color, border: 'none', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', flex: 1, minWidth: 80 });
