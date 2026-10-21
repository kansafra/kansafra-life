'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function SportsMatchesPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMatch, setEditMatch] = useState(null);
  const [form, setForm] = useState({ home_team: '', away_team: '', match_date: '', venue: '', home_score: '', away_score: '', status: 'scheduled', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) supabase.from('entities').select('id').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => { if (data) setEntityId(data.id); });
    loadMatches();
  }, [user, userLoading, dataOwnerName]);

  async function loadMatches() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('sports_matches').select('*').eq('provider_name', dataOwnerName).order('match_date', { ascending: true });
      setMatches(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm({ home_team: '', away_team: '', match_date: '', venue: '', home_score: '', away_score: '', status: 'scheduled', notes: '' });
    setEditMatch(null);
    setShowForm(true);
  }

  function openEdit(m) {
    setForm({
      home_team: m.home_team || '', away_team: m.away_team || '',
      match_date: m.match_date ? m.match_date.slice(0, 16) : '',
      venue: m.venue || '', home_score: String(m.home_score || ''),
      away_score: String(m.away_score || ''), status: m.status || 'scheduled', notes: m.notes || '',
    });
    setEditMatch(m);
    setShowForm(true);
  }

  async function saveMatch(e) {
    e.preventDefault();
    if (!form.home_team.trim() || !form.away_team.trim()) { toastError('أسماء الفريقين مطلوبة'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_id: entityId, provider_name: dataOwnerName,
        home_team: form.home_team.trim(), away_team: form.away_team.trim(),
        match_date: form.match_date || null, venue: form.venue.trim() || null,
        home_score: form.home_score ? Number(form.home_score) : null,
        away_score: form.away_score ? Number(form.away_score) : null,
        status: form.status, notes: form.notes.trim() || null,
      };
      if (editMatch) {
        const { error } = await supabase.from('sports_matches').update(payload).eq('id', editMatch.id);
        if (error) throw error;
        success('✅ تم التعديل');
      } else {
        const { error } = await supabase.from('sports_matches').insert(payload);
        if (error) throw error;
        success('🎉 تمت إضافة المباراة');
      }
      setShowForm(false);
      loadMatches();
    } catch (err) { console.error(err); toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  async function deleteMatch(m) {
    if (!confirm(`حذف مباراة ${m.home_team} ضد ${m.away_team}؟`)) return;
    const { error } = await supabase.from('sports_matches').delete().eq('id', m.id);
    if (!error) { success('🗑️ تم الحذف'); setMatches(prev => prev.filter(x => x.id !== m.id)); }
  }

  function getStatusLabel(status) {
    const map = {
      scheduled: { label: 'قادمة', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
      live: { label: 'جارية', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
      finished: { label: 'منتهية', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
      cancelled: { label: 'ملغاة', color: '#64748b', bg: 'rgba(148,163,184,0.15)' },
    };
    return map[status] || map.scheduled;
  }

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>⚽ المباريات</h1>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{dataOwnerName}</div>
          </div>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <Link href="/merchant/sports_matches" style={navStyle(true)}>⚽ المباريات</Link>
        <Link href="/merchant/sports_players" style={navStyle(false)}>👥 اللاعبون</Link>
        <Link href="/merchant/sports_standings" style={navStyle(false)}>📊 الترتيب</Link>
      </div>

      <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>
        {matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚽</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>لا توجد مباريات مجدولة</div>
            <button onClick={openAdd} style={{ background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ أضف أول مباراة</button>
          </div>
        ) : matches.map(m => {
          const st = getStatusLabel(m.status);
          return (
            <div key={m.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  {m.match_date ? new Date(m.match_date).toLocaleString('ar-SY') : '—'}
                </div>
                <div style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>{st.label}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{m.home_team}</div>
                <div style={{ background: '#0f4d3a', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 16, fontWeight: 900, minWidth: 70, textAlign: 'center' }}>
                  {m.home_score !== null && m.away_score !== null ? `${m.home_score} - ${m.away_score}` : 'VS'}
                </div>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{m.away_team}</div>
              </div>
              {m.venue && <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginBottom: 10 }}>📍 {m.venue}</div>}
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(m)} style={btnStyle('rgba(14,165,233,0.1)', '#0284c7')}>✏️ تعديل</button>
                <button onClick={() => deleteMatch(m)} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 20px' }}>{editMatch ? '✏️ تعديل مباراة' : '⚽ مباراة جديدة'}</h2>
            <form onSubmit={saveMatch}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={labelStyle}>الفريق الأول *</label><input value={form.home_team} onChange={e => setForm({ ...form, home_team: e.target.value })} required style={inputStyle} /></div>
                <div><label style={labelStyle}>الفريق الثاني *</label><input value={form.away_team} onChange={e => setForm({ ...form, away_team: e.target.value })} required style={inputStyle} /></div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>التاريخ والوقت</label><input type="datetime-local" value={form.match_date} onChange={e => setForm({ ...form, match_date: e.target.value })} style={inputStyle} /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>الملعب</label><input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={labelStyle}>هدف الفريق الأول</label><input type="number" value={form.home_score} onChange={e => setForm({ ...form, home_score: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>هدف الفريق الثاني</label><input type="number" value={form.away_score} onChange={e => setForm({ ...form, away_score: e.target.value })} style={inputStyle} /></div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>الحالة</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}><option value="scheduled">قادمة</option><option value="live">جارية</option><option value="finished">منتهية</option><option value="cancelled">ملغاة</option></select></div>
              <div style={{ marginBottom: 20 }}><label style={labelStyle}>ملاحظات</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} /></div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function navStyle(active) { return { background: active ? '#0f4d3a' : '#fff', color: active ? '#fff' : '#64748b', border: active ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap' }; }
const btnStyle = (bg, color) => ({ flex: 1, padding: 10, background: bg, color, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
