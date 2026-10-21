'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function MosqueDetailPage() {
  const { name } = useParams();
  const router = useRouter();
  const mosqueName = decodeURIComponent(name || '');
  const [mosque, setMosque] = useState(null);
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mosqueName) return;
    loadMosque();
  }, [mosqueName]);

  async function loadMosque() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: ent } = await supabase.from('entities').select('*').eq('display_name', mosqueName).maybeSingle();
      if (!ent) { setLoading(false); return; }
      setMosque(ent);
      const { data: serm } = await supabase.from('sermons').select('*').eq('provider_name', mosqueName).eq('is_active', true).order('sermon_date', { ascending: false });
      setSermons(serm || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;
  if (!mosque) return <div style={{ padding: 80, textAlign: 'center' }}>المسجد غير موجود</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '20px', paddingBottom: 40, color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 40, height: 40, borderRadius: '50%', color: '#fff', fontSize: 18, cursor: 'pointer' }}>←</button>
          <h1 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>🕌 المسجد</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {mosque.logo_url ? <img src={mosque.logo_url} alt="" style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', border: '3px solid rgba(255,255,255,0.3)' }} /> : <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🕌</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, marginBottom: 4 }}>{mosque.display_name}</h2>
            {mosque.city && <div style={{ fontSize: 12, opacity: 0.85 }}>📍 {mosque.city}</div>}
            {mosque.is_verified && <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 900, marginTop: 4 }}>✅ مسجد موثق</div>}
          </div>
        </div>
      </div>

      <div style={{ padding: 16, marginTop: -24, maxWidth: 800, margin: '0 auto' }}>
        {mosque.description && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 900, marginBottom: 6 }}>📝 عن المسجد</div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{mosque.description}</div>
          </div>
        )}

        {sermons.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>🎙️ الخطب</h3>
            {sermons.map(s => (
              <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{s.title}</div>
                {s.speaker && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>🎙️ {s.speaker}</div>}
                {s.sermon_date && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>📅 {new Date(s.sermon_date).toLocaleDateString('ar-SY')}</div>}
                {s.content && <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginTop: 8 }}>{s.content}</div>}
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {s.audio_url && <a href={s.audio_url} target="_blank" rel="noreferrer" style={{ flex: 1, padding: 10, background: 'rgba(14,165,233,0.1)', color: '#0284c7', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, textAlign: 'center', textDecoration: 'none' }}>🎧 استماع</a>}
                  {s.video_url && <a href={s.video_url} target="_blank" rel="noreferrer" style={{ flex: 1, padding: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, textAlign: 'center', textDecoration: 'none' }}>📺 مشاهدة</a>}
                </div>
              </div>
            ))}
          </div>
        )}

        {sermons.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🕌</div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>لا توجد خطب منشورة</div>
          </div>
        )}
      </div>
    </div>
  );
}
