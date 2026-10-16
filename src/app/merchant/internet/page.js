'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function Page() {
  const router = useRouter();
  const [s, setS] = useState(null);
  const [st, setSt] = useState({ plans: 0, subs: 0, inv: 0, unpaid: 0, tk: 0, open: 0 });

  useEffect(() => {
    const x = getSession();
    if (!x) { router.replace('/login'); return; }
    setS(x);
    load(x);
  }, [router]);

  async function load(x) {
    if (!supabase) return;
    const [a, b, c, d, e, f] = await Promise.all([
      supabase.from('isp_plans').select('id', { count: 'exact', head: true }).eq('entity_name', x.display_name),
      supabase.from('isp_subscribers').select('id', { count: 'exact', head: true }).eq('entity_name', x.display_name).eq('status', 'active'),
      supabase.from('isp_invoices').select('id', { count: 'exact', head: true }).eq('entity_name', x.display_name),
      supabase.from('isp_invoices').select('id', { count: 'exact', head: true }).eq('entity_name', x.display_name).eq('status', 'unpaid'),
      supabase.from('isp_tickets').select('id', { count: 'exact', head: true }).eq('entity_name', x.display_name),
      supabase.from('isp_tickets').select('id', { count: 'exact', head: true }).eq('entity_name', x.display_name).eq('status', 'open'),
    ]);
    setSt({ plans: a.count || 0, subs: b.count || 0, inv: c.count || 0, unpaid: d.count || 0, tk: e.count || 0, open: f.count || 0 });
  }

  if (!s) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  const cards = [
    { href: '/merchant/internet/plans', icon: '📶', title: 'الباقات', value: st.plans, color: '#0ea5e9' },
    { href: '/merchant/internet/subscribers', icon: '👥', title: 'المشتركون', value: st.subs, color: '#22c55e' },
    { href: '/merchant/internet/invoices', icon: '🧾', title: 'الفواتير', value: st.inv, color: '#8b5cf6' },
    { href: '/merchant/internet/invoices?filter=unpaid', icon: '⚠️', title: 'غير مدفوعة', value: st.unpaid, color: '#f59e0b' },
    { href: '/merchant/internet/tickets', icon: '🛠️', title: 'التذاكر', value: st.tk, color: '#64748b' },
    { href: '/merchant/internet/tickets?filter=open', icon: '🔔', title: 'تذاكر مفتوحة', value: st.open, color: '#dc2626' },
  ];

  return (
    <div className="sect-page" style={{ paddingBottom: 60 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">🌐 مزود الإنترنت</span>
        <span style={{ width: 40 }} />
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ padding: 20, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderRadius: 20, color: '#fff', marginBottom: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌐</div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{s.display_name}</div>
          <div style={{ fontSize: 12, opacity: .85, marginTop: 4 }}>مزود خدمة الإنترنت</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {cards.map((c) => (
            <Link key={c.href} href={c.href} style={{ padding: 16, background: c.color + '12', border: '1.5px solid ' + c.color + '40', borderRadius: 18, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 28 }}>{c.icon}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-600)', fontWeight: 800 }}>{c.title}</span>
              <span style={{ fontSize: 26, fontWeight: 900, color: c.color }}>{c.value}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
