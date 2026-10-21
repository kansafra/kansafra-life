'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function MerchantSermonsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();
  const [entityId, setEntityId] = useState(null);
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editSermon, setEditSermon] = useState(null);
  const [form, setForm] = useState({ title: '', speaker: '', content: '', audio_url: '', video_url: '', sermon_date: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) supabase.from('entities').select('id').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => { if (data) setEntityId(data.id); });
    loadSermons();
  }, [user, userLoading, dataOwnerName]);

  async function loadSermons() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('sermons').select('*').eq('provider_name', dataOwnerName).order('sermon_date', { ascending: false });
      setSermons(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm({ title: '', speaker: '', content: '', audio_url: '', video_url: '', sermon_date: new Date().toISOString().split('T')[0] });
    setEditSermon(null);
    setShowForm(true);
  }

  function openEdit(s) {
    setForm({
      title: s.title || '', speaker: s.speaker || '', content: s.content || '',
      audio_url: s.audio_url || '', video_url: s.video_url || '',
      sermon_date: s.sermon_date || '',
    });
    setEditSermon(s);
    setShowForm(true);
  }

  async function saveSermon(e) {
    e.preventDefault();
    if (!form.title.trim()) { toastError('عنوان الخطبة مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_id: entityId, provider_name: dataOwnerName,
        title: form.title.trim(), speaker: form.speaker.trim() || null,
        content: form.content.trim() || null,
        audio_url: form.audio_url.trim() || null,
        video_url: form.video_url.trim() || null,
        sermon_date: form.sermon_date || null,
        is_active: true,
      };
      if (editSermon) {
        const { error } = await supabase.from('sermons').update(payload).eq('id', editSermon.id);
        if (error) throw error;
        success('✅ تم التعديل');
      } else {
        const { error } = await supabase.from('sermons').insert(payload);
        if (error) throw error;
        success('🎉 تم إضافة الخطبة');
      }
      setShowForm(false);
      loadSermons();
    } catch (err) { console.error(err); toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  async function toggleActive(s) {
    const { error } = await supabase.from('sermons').update({ is_active: !s.is_active }).eq('id', s.id);
    if (!error) {
      success(s.is_active ? '🙈 مخفية' : '✅ نشطة');
      setSermons(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x));
    }
  }

  async function deleteSermon(s) {
    if (!confirm(`حذف الخطبة "${s.title}"؟`)) return;
    setDeleting(s.id);
    const { error } = await supabase.from('sermons').delete().eq('id', s.id);
    if (!error) { success('🗑️ تم الحذف'); setSermons(prev => prev.filter(x => x.id !== s.id)); }
    setDeleting(null);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return sermons;
    const q = search.trim().toLowerCase();
    return sermons.filter(s => (s.title || '').toLowerCase().includes(q) || (s.speaker || '').toLowerCase().includes(q));
  }, [sermons, search]);

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}><h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>🕌 الخطب</h1></div>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
        <input type="search" placeholder="🔍 ابحث في الخطب..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🕌</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{sermons.length === 0 ? 'لا توجد خطب بعد' : 'لا نتائج'}</div>
            {sermons.length === 0 && <button onClick={openAdd} style={{ background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ أضف أول خطبة</button>}
          </div>
        ) : filtered.map(s => (
          <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0', opacity: s.is_active ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{s.title}</div>
                {s.speaker && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>🎙️ {s.speaker}</div>}
                {s.sermon_date && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>📅 {new Date(s.sermon_date).toLocaleDateString('ar-SY')}</div>}
              </div>
              <div style={{ background: s.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.15)', color: s.is_active ? '#10b981' : '#64748b', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>{s.is_active ? '✅' : '⏸️'}</div>
            </div>
            {s.content && <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.content}</div>}
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(s)} style={btnStyle('rgba(14,165,233,0.1)', '#0284c7')}>✏️ تعديل</button>
              <button onClick={() => toggleActive(s)} style={btnStyle(s.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', s.is_active ? '#f59e0b' : '#10b981')}>{s.is_active ? '🙈' : '👁️'}</button>
              <button onClick={() => deleteSermon(s)} disabled={deleting === s.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>{deleting === s.id ? '⏳' : '🗑️'}</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 20px' }}>{editSermon ? '✏️ تعديل خطبة' : '🕌 خطبة جديدة'}</h2>
            <form onSubmit={saveSermon}>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>عنوان الخطبة *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={inputStyle} /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>الخطيب</label><input value={form.speaker} onChange={e => setForm({ ...form, speaker: e.target.value })} style={inputStyle} /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>المحتوى</label><textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} style={{ ...inputStyle, height: 120, resize: 'none' }} /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>رابط الصوت</label><input value={form.audio_url} onChange={e => setForm({ ...form, audio_url: e.target.value })} style={inputStyle} placeholder="https://..." /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>رابط الفيديو</label><input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} style={inputStyle} placeholder="https://..." /></div>
              <div style={{ marginBottom: 20 }}><label style={labelStyle}>التاريخ</label><input type="date" value={form.sermon_date} onChange={e => setForm({ ...form, sermon_date: e.target.value })} style={inputStyle} /></div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
const btnStyle = (bg, color) => ({ flex: 1, padding: 10, background: bg, color, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
