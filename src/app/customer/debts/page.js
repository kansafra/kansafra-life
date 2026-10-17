'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function CustomerDebtsPage() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let customer = null;
    try { customer = JSON.parse(localStorage.getItem('sanad_customer') || 'null'); } catch {}
    if (!customer || !supabase) { setLoading(false); return; }

    (async () => {
      const { data } = await supabase
        .from('debts')
        .select('*')
        .eq('customer_phone', customer.phone)
        .order('created_at', { ascending: false });
      if (Array.isArray(data)) setDebts(data);
      setLoading(false);
    })();
  }, []);

  const totalOwed = debts.reduce((s, d) => s + (Number(d.amount || 0) - Number(d.paid || 0)), 0);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#0a1f16,#061410)', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, padding: '14px 16px', background: 'rgba(10,31,22,.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/customer" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
        <h1 style={{ flex: 1, margin: 0, fontSize: 16, fontWeight: 900, color: '#fff' }}>ديوني</h1>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(251,191,36,.12), rgba(245,158,11,.08))', border: '1px solid rgba(251,191,36,.25)', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', fontWeight: 700, marginBottom: 8 }}>إجمالي المتبقي عليك</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: totalOwed > 0 ? '#fbbf24' : '#34d399' }}>
            {totalOwed.toLocaleString('ar-SY')}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 4 }}>ل.س</div>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.6)' }}>جارٍ التحميل...</div>}

        {!loading && debts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,.5)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>💰</div>
            <p style={{ fontSize: 15, fontWeight: 700 }}>ما عندك ديون</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>الحمد لله، سجلّك نظيف ✨</p>
          </div>
        )}

        {debts.map((d) => {
          const remaining = Number(d.amount || 0) - Number(d.paid || 0);
          return (
            <div key={d.id} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{d.entity_name || d.provider_name || 'بائع'}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: remaining > 0 ? 'rgba(220,38,38,.15)' : 'rgba(16,185,129,.15)', color: remaining > 0 ? '#f87171' : '#34d399', fontWeight: 800 }}>
                  {remaining > 0 ? 'متبقي' : 'مسدد'}
                </span>
              </div>
              {d.description && <p style={{ margin: '0 0 8px', fontSize: 11.5, color: 'rgba(255,255,255,.6)' }}>{d.description}</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                <span style={{ color: 'rgba(255,255,255,.5)' }}>الإجمالي: {Number(d.amount || 0).toLocaleString('ar-SY')}</span>
                <span style={{ color: remaining > 0 ? '#fbbf24' : '#34d399', fontWeight: 800 }}>
                  متبقي: {remaining.toLocaleString('ar-SY')} ل.س
                </span>
              </div>
              {d.created_at && (
                <div style={{ marginTop: 8, fontSize: 10.5, color: 'rgba(255,255,255,.4)' }}>
                  📅 {new Date(d.created_at).toLocaleDateString('ar-EG')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
