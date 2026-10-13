'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const TYPE_LABELS = {
  merchant:'🏪 متجر', doctor:'👨‍⚕️ طبيب', pharmacy:'💊 صيدلية',
  school:'🏫 مدرسة', mosque:'🕌 جامع', municipality:'🏢 بلدية',
  council:'🏛️ مجلس', charity:'🤝 جمعية', sports:'⚽ نادي',
  memory:'📸 ذاكرة', office:'📁 مكتب', restaurant:'🍽️ مطعم',
  transport:'🚗 مواصلات',
};

export default function AdminEntities() {
  const router = useRouter();
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('entities').select('*').order('created_at', { ascending: false });
    setEntities(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function toggleActive(ent) {
    const { error } = await supabase.from('entities').update({ is_active: !ent.is_active }).eq('id', ent.id);
    if (!error) setEntities((arr) => arr.map((e) => e.id === ent.id ? { ...e, is_active: !e.is_active } : e));
  }

  async function del(ent) {
    if (!confirm(`حذف "${ent.display_name}" نهائياً؟`)) return;
    const { error } = await supabase.from('entities').delete().eq('id', ent.id);
    if (!error) setEntities((arr) => arr.filter((e) => e.id !== ent.id));
  }

  const types = ['all', ...new Set(entities.map((e) => e.entity_type))];

  const filtered = entities.filter((e) => {
    if (filter !== 'all' && e.entity_type !== filter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (e.display_name || '').toLowerCase().includes(q)
        || (e.username || '').toLowerCase().includes(q)
        || (e.phone || '').toLowerCase().includes(q);
  });

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">إدارة الكيانات</span>
        <span className="admin-sub-count">{entities.length}</span>
      </div>

      <div className="admin-search">
        <input type="text" placeholder="ابحث بالاسم أو المستخدم أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="admin-filters">
        <button className={`admin-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} type="button">
          الكل ({entities.length})
        </button>
        {types.filter((t) => t !== 'all').map((t) => (
          <button key={t} className={`admin-filter ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)} type="button">
            {TYPE_LABELS[t] || t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty"><span className="em">🏢</span><p>لا توجد نتائج</p></div>
      ) : (
        <div className="admin-items">
          {filtered.map((e) => (
            <div key={e.id} className="admin-item">
              <div className="admin-item-icon">{TYPE_LABELS[e.entity_type]?.split(' ')[0] || '🏢'}</div>
              <div className="admin-item-body">
                <div className="admin-item-title">{e.display_name}</div>
                <div className="admin-item-meta">
                  <span>@{e.username}</span>
                  {e.phone && <span>{e.phone}</span>}
                  <span className={`admin-badge ${e.is_active ? 'active' : 'danger'}`}>
                    {e.is_active ? 'نشط' : 'موقوف'}
                  </span>
                </div>
              </div>
              <div className="admin-item-actions">
                <button className="admin-act-btn ok" onClick={() => toggleActive(e)} type="button" title={e.is_active ? 'إيقاف' : 'تفعيل'}>
                  {e.is_active ? '⏸' : '▶'}
                </button>
                <button className="admin-act-btn del" onClick={() => del(e)} type="button" title="حذف">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
