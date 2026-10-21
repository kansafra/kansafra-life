'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SchoolPublicPage() {
  const { name } = useParams();
  const router = useRouter();
  const schoolName = decodeURIComponent(name || '');

  const [school, setSchool] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolName) return;
    loadSchool();
  }, [schoolName]);

  async function loadSchool() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: ent } = await supabase.from('entities').select('*').eq('display_name', schoolName).maybeSingle();
      if (!ent) { setLoading(false); return; }
      setSchool(ent);

      const [tRes, cRes] = await Promise.all([
        supabase.from('teachers').select('*').eq('provider_name', schoolName).eq('is_active', true),
        supabase.from('classes').select('*').eq('provider_name', schoolName).eq('is_active', true),
      ]);
      setTeachers(tRes.data || []);
      setClasses(cRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;
  if (!school) return <div style={{ padding: 80, textAlign: 'center' }}>المدرسة غير موجودة</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '20px', paddingBottom: 40, color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 40, height: 40, borderRadius: '50%', color: '#fff', fontSize: 18, cursor: 'pointer' }}>←</button>
          <h1 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>🏫 صفحة المدرسة</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {school.logo_url ? <img src={school.logo_url} alt="" style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', border: '3px solid rgba(255,255,255,0.3)' }} /> : <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🏫</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, marginBottom: 4 }}>{school.display_name}</h2>
            {school.city && <div style={{ fontSize: 12, opacity: 0.85 }}>📍 {school.city}</div>}
            {school.is_verified && <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 900, marginTop: 4 }}>✅ مدرسة موثقة</div>}
          </div>
        </div>
      </div>

      <div style={{ padding: 16, marginTop: -24, maxWidth: 800, margin: '0 auto' }}>
        {school.description && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 900, marginBottom: 6 }}>📝 عن المدرسة</div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{school.description}</div>
          </div>
        )}

        {/* Teachers */}
        {teachers.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>👨‍🏫 طاقم التدريس ({teachers.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
              {teachers.map(t => (
                <div key={t.id} style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, margin: '0 auto 10px' }}>
                    {t.image_url ? <img src={t.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (t.name || '؟').charAt(0)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{t.name}</div>
                  {t.subject && <div style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 800 }}>{t.subject}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Classes */}
        {classes.length > 0 && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>📚 الصفوف ({classes.length})</h3>
            {classes.map(c => (
              <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  🎓 {c.grade_level}
                  {c.schedule && ` · ⏰ ${c.schedule}`}
                  {c.room && ` · 🚪 ${c.room}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {teachers.length === 0 && classes.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏫</div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>لا توجد معلومات منشورة</div>
          </div>
        )}

        {/* Contact */}
        {(school.phone || school.whatsapp) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {school.phone && <a href={`tel:${school.phone}`} style={{ flex: 1, padding: 14, background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>📞 اتصل</a>}
            {school.whatsapp && <a href={`https://wa.me/${(school.whatsapp||'').replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: 14, background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>💬 واتساب</a>}
          </div>
        )}
      </div>
    </div>
  );
}
