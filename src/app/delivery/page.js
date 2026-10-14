'use client';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function DeliveryPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('delivery_agents').select('*').order('created_at', { ascending: false });
    setAgents(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function apply() {
    const name = prompt('اسمك الكامل:');
    if (!name) return;
    const phone = prompt('رقم هاتفك:');
    if (!phone) return;
    const vehicle = prompt('نوع المركبة (دراجة/سيارة/شاحنة):') || 'دراجة';
    const city = prompt('المدينة/المنطقة:') || '';
    const { error } = await supabase.from('delivery_agents').insert({
      full_name: name, phone, vehicle_type: vehicle, city, is_available: true, rating: 5,
    });
    if (!error) { alert('✅ تم تسجيلك كمندوب'); load(); }
  }

  return (
    <div className="ent-page">
      <div className="inv-header">
        <Link href="/" className="inv-back">→</Link>
        <span className="inv-title">🚚 التوصيل</span>
        <button className="mng-add-btn" onClick={apply} type="button">+ كن مندوباً</button>
      </div>

      <div style={{ padding: '16px 20px 0', fontSize: 12, color: 'var(--n-500)', fontWeight: 600 }}>
        مندوبون متاحون للتوصيل في المنطقة
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : agents.length === 0 ? (
        <div className="sect-empty"><span className="em">🚚</span><p>لا يوجد مندوبون مسجلون</p></div>
      ) : (
        <div style={{ padding: 20 }}>
          {agents.map((a) => (
            <div key={a.id} className="dlv-card">
              <div className="dlv-head">
                <div className="dlv-name">{a.full_name}</div>
                <span className={`dlv-status ${a.is_available ? 'available' : 'busy'}`}>
                  {a.is_available ? '✓ متاح' : '⏳ مشغول'}
                </span>
              </div>
              <div className="dlv-info">🚗 {a.vehicle_type || '—'} {a.city && `· 📍 ${a.city}`}</div>
              <div className="dlv-rating">⭐ {a.rating || 5}/5 {a.rating_count > 0 && `(${a.rating_count})`}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <a href={`tel:${a.phone}`} className="mng-btn primary" style={{ flex: 1, textDecoration: 'none' }}>📞 اتصل</a>
                <a href={`https://wa.me/${String(a.phone).replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="mng-btn edit" style={{ flex: 1, textDecoration: 'none', background: 'rgba(37,211,102,.15)', color: '#128C7E' }}>💬 واتساب</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
