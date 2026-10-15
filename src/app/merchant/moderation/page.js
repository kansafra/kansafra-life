'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const STATUS_MAP = {
  pending:  { label: 'قيد المراجعة', badge: 'warn',   icon: '⏳' },
  approved: { label: 'منشور',        badge: 'active', icon: '✅' },
  auto:     { label: 'منشور تلقائي',  badge: 'active', icon: '🚀' },
  rejected: { label: 'مرفوض',        badge: 'danger', icon: '❌' },
};

export default function MerchantModeration() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('provider_name', ent.display_name)
      .order('created_at', { ascending: false });
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  const counts = {
    pending:  items.filter((i) => i.moderation_status === 'pending').length,
    approved: items.filter((i) => i.moderation_status === 'approved' || !i.moderation_status).length,
    rejected: items.filter((i) => i.moderation_status === 'rejected').length,
  };

  const filtered = tab === 'all' ? items : items.filter((i) => {
    if (tab === 'pending') return i.moderation_status === 'pending';
    if (tab === 'approved') return i.moderation_status === 'approved' || !i.moderation_status;
    if (tab === 'rejected') return i.moderation_status === 'rejected';
    return true;
  });

  return (
    <div className="sect-page" style={{ paddingBottom: 100 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">⏳ قيد المراجعة</span>
        <span className="inv-count">{items.length}</span>
      </div>

      <div className="chips-scroll" style={{ padding: '12px 16px' }}>
        <button className={`chip ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')} type="button">
          ⏳ قيد المراجعة ({counts.pending})
        </button>
        <button className={`chip ${tab === 'approved' ? 'active' : ''}`} onClick={() => setTab('approved')} type="button">
          ✅ منشور ({counts.approved})
        </button>
        <button className={`chip ${tab === 'rejected' ? 'active' : ''}`} onClick={() => setTab('rejected')} type="button">
          ❌ مرفوض ({counts.rejected})
        </button>
        <button className={`chip ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')} type="button">
          الكل ({items.length})
        </button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty">
          <span className="em">📋</span>
          <p>{tab === 'pending' ? 'لا يوجد محتوى قيد المراجعة' : 'لا يوجد محتوى'}</p>
        </div>
      ) : (
        <div style={{ padding: 16 }}>
          {filtered.map((item) => {
            const status = STATUS_MAP[item.moderation_status] || STATUS_MAP.approved;
            return (
              <div key={item.id} className="debt-card" style={{ borderRightColor: '#0f4d3a', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>{item.title}</div>
                    {item.description && (
                      <div style={{ fontSize: 11.5, color: 'var(--n-500)', lineHeight: 1.6, marginBottom: 6 }}>
                        {item.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className={`admin-badge ${status.badge}`} style={{ fontSize: 10.5 }}>
                        {status.icon} {status.label}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--n-400)' }}>
                        {new Date(item.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {item.moderation_status === 'rejected' && item.moderation_notes && (
                  <div style={{ marginTop: 10, padding: 10, background: 'rgba(220,38,38,.1)', borderRadius: 8, fontSize: 11.5 }}>
                    ❌ سبب الرفض: {item.moderation_notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
