'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const TABLES = ['entities','services','products','orders','sos_alerts','service_categories','announcements','reviews','vehicles','appointments','blood_donors','blood_requests','classes','students','lessons','circles','donations','sports_players','sports_matches','memory_stories','memory_places','memory_items','library_books','touristic_places','job_postings','real_estate','lost_found','elderly_requests','expat_services','auctions','office_requests','notifications','payment_methods','debts','loyalty_points','coupons','subscriptions','support_tickets'];

export default function AdminBackup() {
  const router = useRouter();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    loadBackups();
  }, [router]);

  async function loadBackups() {
    if (!supabase) return;
    const { data } = await supabase.from('backups').select('*').order('created_at', { ascending: false });
    setBackups(Array.isArray(data) ? data : []);
  }

  async function createBackup() {
    if (!supabase) return;
    setLoading(true);
    setProgress('جارٍ إنشاء النسخة...');

    const dump = { created_at: new Date().toISOString(), version: '1.0', data: {} };
    let totalRows = 0;

    for (let i = 0; i < TABLES.length; i++) {
      const t = TABLES[i];
      setProgress(`تحميل ${t} (${i+1}/${TABLES.length})`);
      try {
        const { data } = await supabase.from(t).select('*').limit(10000);
        dump.data[t] = data || [];
        totalRows += (data?.length || 0);
      } catch (e) {
        dump.data[t] = [];
      }
    }

    // حفظ يوجد localStorage كملف قابل للتنزيل
    const sizeKb = Math.round(JSON.stringify(dump).length / 1024);
    const name = `backup-${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36)}`;

    await supabase.from('backups').insert({
      name,
      tables_list: TABLES,
      total_rows: totalRows,
      size_kb: sizeKb,
    });

    setProgress('');

    // تنزيل مباشر
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);

    setLoading(false);
    loadBackups();
    alert(`✅ تم إنشاء النسخة (${totalRows} صف، ${sizeKb}KB) وتم تنزيلها`);
  }

  async function delBackup(b) {
    if (!confirm('حذف السجل؟')) return;
    await supabase.from('backups').delete().eq('id', b.id);
    loadBackups();
  }

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">💾 النسخ الاحتياطي</span>
        <button className="mng-add-btn" onClick={createBackup} disabled={loading} type="button">
          {loading ? '...' : '+ نسخة جديدة'}
        </button>
      </div>

      {progress && (
        <div style={{ padding: '14px 20px', color: '#e8b923', fontSize: 13, fontWeight: 800 }}>
          ⏳ {progress}
        </div>
      )}

      <div style={{ padding: '14px 20px 0', fontSize: 12, color: 'rgba(255,255,255,.45)', fontWeight: 600, lineHeight: 1.6 }}>
        نسخة كاملة من كل الجداول (JSON) قابلة للتنزيل والاستعادة اليدوية.
      </div>

      {backups.length === 0 ? (
        <div className="sect-empty"><span className="em">💾</span><p>لا توجد نسخ احتياطية</p></div>
      ) : (
        <div className="backup-list">
          {backups.map((b) => (
            <div key={b.id} className="backup-item">
              <div className="backup-icon">💾</div>
              <div className="backup-body">
                <div className="backup-name">{b.name}</div>
                <div className="backup-meta">
                  {b.total_rows} صف · {b.size_kb}KB · {new Date(b.created_at).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button className="backup-btn del" onClick={() => delBackup(b)} type="button">🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
