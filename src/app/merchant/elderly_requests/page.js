'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

const COLS = ["requester_name","service_type","status"];

export default function Page() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/login'); return; }
    setSession(s);
    load(s);
  }, [router]);

  async function load(s) {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('elderly_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sect-page" style={{ paddingBottom: 60 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">👴 طلبات كبار السن</span>
        <span className="inv-count">{items.length}</span>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : items.length === 0 ? (
        <div className="sect-empty">
          <span className="em">📋</span>
          <p>لا توجد عناصر بعد</p>
        </div>
      ) : (
        <div style={{ padding: 16 }}>
          {items.map((item) => (
            <div key={item.id} className="debt-card" style={{ borderRightColor: '#0f4d3a', marginBottom: 10 }}>
              {COLS.map((col) => (
                item[col] ? (
                  <div key={col} style={{ fontSize: 12.5, color: 'var(--n-300)', marginBottom: 4 }}>
                    <strong style={{ color: 'var(--n-500)' }}>{col}:</strong> {String(item[col]).slice(0, 80)}
                  </div>
                ) : null
              ))}
              <div style={{ fontSize: 10, color: 'var(--n-400)', marginTop: 6 }}>
                {new Date(item.created_at).toLocaleString('ar-EG')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
