'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function AdminCurrencyPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!admin) { router.replace('/admin/login'); return; }
    loadRates();
  }, [router]);

  async function loadRates() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('currency_rates').select('*').order('code');
      setRates(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function saveRate(rate) {
    const newRate = Number(editValue);
    if (!newRate || newRate <= 0) { toastError('أدخل قيمة صحيحة'); return; }
    setWorking(true);
    try {
      const { error } = await supabase.from('currency_rates').update({ rate_to_syp: newRate, updated_at: new Date().toISOString() }).eq('id', rate.id);
      if (error) throw error;
      success('✅ تم تحديث السعر');
      setRates(prev => prev.map(r => r.id === rate.id ? { ...r, rate_to_syp: newRate } : r));
      setEditing(null);
    } catch (err) { toastError('فشل التحديث'); }
    finally { setWorking(false); }
  }

  async function toggleActive(rate) {
    const { error } = await supabase.from('currency_rates').update({ is_active: !rate.is_active }).eq('id', rate.id);
    if (!error) {
      success(rate.is_active ? '⏸️ معطلة' : '✅ مفعلة');
      setRates(prev => prev.map(r => r.id === rate.id ? { ...r, is_active: !r.is_active } : r));
    }
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>💱 أسعار العملات</h1>
      </div>

      <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        <div style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 800, lineHeight: 1.6 }}>
            💡 أسعار الصرف مقابل الليرة السورية. اضغط على أي عملة لتعديل السعر.
          </div>
        </div>

        {rates.map(r => {
          const isEditing = editing === r.id;
          return (
            <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, border: '1px solid #e2e8f0', opacity: r.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isEditing ? 12 : 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>{r.symbol}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>{r.code}</div>
                </div>
                {!isEditing && (
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#0f4d3a' }}>{Number(r.rate_to_syp).toLocaleString()}</div>
                    <div style={{ fontSize: 9.5, color: '#64748b' }}>ل.س</div>
                  </div>
                )}
              </div>
              {isEditing ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} autoFocus />
                  <button onClick={() => saveRate(r)} disabled={working} style={{ padding: '10px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: working ? 'wait' : 'pointer', fontFamily: 'inherit' }}>{working ? '⏳' : '✓'}</button>
                  <button onClick={() => setEditing(null)} style={{ padding: '10px 16px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button onClick={() => { setEditing(r.id); setEditValue(String(r.rate_to_syp)); }} style={{ flex: 1, padding: 8, background: 'rgba(14,165,233,0.1)', color: '#0284c7', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ تعديل</button>
                  <button onClick={() => toggleActive(r)} style={{ flex: 1, padding: 8, background: r.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: r.is_active ? '#f59e0b' : '#10b981', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{r.is_active ? '⏸️' : '✅'}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
