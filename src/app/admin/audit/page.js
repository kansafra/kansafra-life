'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const ACTION_TYPES = {
  update_info:          { label: 'تحديث بيانات',    icon: '📝', color: '#3b82f6' },
  change_username:      { label: 'تغيير اسم الدخول', icon: '👤', color: '#8b5cf6' },
  reset_password:       { label: 'إعادة كلمة مرور',  icon: '🔑', color: '#ef4444' },
  renew_subscription:   { label: 'تجديد اشتراك',     icon: '💎', color: '#10b981' },
  change_plan:          { label: 'تغيير باقة',       icon: '📊', color: '#f59e0b' },
  change_status:        { label: 'تغيير حالة',       icon: '🔄', color: '#0ea5e9' },
  update_limits:        { label: 'تحديث حدود',       icon: '📈', color: '#06b6d4' },
  delete_entity:        { label: 'حذف متجر',         icon: '🗑️', color: '#dc2626' },
};

const RANGES = [
  { key: 'today', label: 'اليوم' },
  { key: 'week', label: 'أسبوع' },
  { key: 'month', label: 'شهر' },
  { key: 'all', label: 'الكل' },
];

function getStartDate(range) {
  const now = new Date();
  if (range === 'today') { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }
  if (range === 'week') { const d = new Date(now); d.setDate(now.getDate() - 7); return d; }
  if (range === 'month') { const d = new Date(now); d.setDate(now.getDate() - 30); return d; }
  return null;
}

export default function AdminAuditPage() {
  const router = useRouter();
  const { success } = useToast();

  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [range, setRange] = useState('week');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!admin) { router.replace('/admin/login'); return; }
    loadActions();
  }, [router]);

  async function loadActions() {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('admin_actions').select('*').order('created_at', { ascending: false }).limit(500);
      setActions(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = useMemo(() => {
    let list = actions;
    
    const start = getStartDate(range);
    if (start) list = list.filter(a => a.created_at && new Date(a.created_at) >= start);
    
    if (typeFilter !== 'all') list = list.filter(a => a.action_type === typeFilter);
    
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a => 
        (a.admin_username || '').toLowerCase().includes(q) ||
        (a.details?.name || '').toLowerCase().includes(q) ||
        (a.action_type || '').toLowerCase().includes(q)
      );
    }
    
    return list;
  }, [actions, typeFilter, range, search]);

  const stats = useMemo(() => {
    const start = getStartDate(range);
    const scoped = start ? actions.filter(a => a.created_at && new Date(a.created_at) >= start) : actions;
    const byType = {};
    scoped.forEach(a => { byType[a.action_type] = (byType[a.action_type] || 0) + 1; });
    return {
      total: scoped.length,
      byType,
      admins: new Set(scoped.map(a => a.admin_username).filter(Boolean)).size,
    };
  }, [actions, range]);

  function formatDate(date) {
    if (!date) return '—';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `قبل ${diffMin} دقيقة`;
    if (diffMin < 1440) return `قبل ${Math.floor(diffMin / 60)} ساعة`;
    if (diffMin < 10080) return `قبل ${Math.floor(diffMin / 1440)} يوم`;
    return d.toLocaleDateString('ar-SY');
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>📜 سجل الإجراءات</h1>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>{stats.total}</div>
        </div>
        <input 
          type="search" 
          placeholder="🔍 ابحث بالأدمن أو المتجر..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)', marginBottom: 12 }} 
        />
        
        {/* Range Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto' }}>
          {RANGES.map(r => (
            <button key={r.key} onClick={() => setRange(r.key)} style={{
              background: range === r.key ? '#fff' : 'rgba(255,255,255,0.1)',
              color: range === r.key ? '#0f172a' : '#fff',
              border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 900,
              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit'
            }}>{r.label}</button>
          ))}
        </div>

        {/* Type Filters */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setTypeFilter('all')} style={{
            background: typeFilter === 'all' ? '#fbbf24' : 'rgba(255,255,255,0.1)',
            color: typeFilter === 'all' ? '#0f172a' : '#fff',
            border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 900,
            cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit'
          }}>الكل ({stats.total})</button>
          {Object.entries(ACTION_TYPES).map(([key, type]) => {
            const count = stats.byType[key] || 0;
            if (count === 0) return null;
            return (
              <button key={key} onClick={() => setTypeFilter(key)} style={{
                background: typeFilter === key ? type.color : 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 900,
                cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit'
              }}>{type.icon} {type.label} ({count})</button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatCard icon="📜" label="الإجراءات" value={stats.total} color="#0f4d3a" />
          <StatCard icon="👤" label="الأدمن" value={stats.admins} color="#8b5cf6" />
          <StatCard icon="📅" label="المدة" value={RANGES.find(r => r.key === range)?.label} color="#0ea5e9" />
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📜</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 6 }}>لا توجد إجراءات</div>
            <div style={{ fontSize: 12 }}>{range !== 'all' ? 'جرّب توسيع الفترة الزمنية' : 'لم يتم تنفيذ أي إجراء بعد'}</div>
          </div>
        ) : filtered.map(action => {
          const type = ACTION_TYPES[action.action_type] || { label: action.action_type, icon: '📌', color: '#64748b' };
          const isExpanded = expandedId === action.id;
          return (
            <div key={action.id} style={{ background: '#fff', borderRadius: 14, marginBottom: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div 
                onClick={() => setExpandedId(isExpanded ? null : action.id)}
                style={{ padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${type.color}15`, color: type.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{type.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{type.label}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    بواسطة <strong style={{ color: '#0f4d3a' }}>@{action.admin_username || 'unknown'}</strong>
                    {action.details?.name && <> · {action.details.name}</>}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{formatDate(action.created_at)}</div>
                </div>
                <div style={{ fontSize: 16, color: '#94a3b8', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>‹</div>
              </div>

              {isExpanded && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', marginBottom: 6 }}>تفاصيل</div>
                  <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                    <pre style={{ margin: 0, fontSize: 11, color: '#1e293b', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
{JSON.stringify(action.details || {}, null, 2)}
                    </pre>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10, color: '#94a3b8' }}>
                    <span>ID: {action.id.slice(0, 8)}...</span>
                    <span>{action.created_at ? new Date(action.created_at).toLocaleString('ar-SY') : ''}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e2e8f0', textAlign: 'center' }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, marginTop: 2 }}>{label}</div>
    </div>
  );
}
