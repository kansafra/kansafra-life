'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function SportsStandingsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [form, setForm] = useState({ team_name: '', played: '0', won: '0', drawn: '0', lost: '0', goals_for: '0', goals_against: '0', points: '0' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) supabase.from('entities').select('id').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => { if (data) setEntityId(data.id); });
    loadStandings();
  }, [user, userLoading, dataOwnerName]);

  async function loadStandings() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('sports_standings').select('*').eq('provider_name', dataOwnerName).order('points', { ascending: false });
      setStandings(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm({ team_name: '', played: '0', won: '0', drawn: '0', lost: '0', goals_for: '0', goals_against: '0', points: '0' });
    setEditTeam(null);
    setShowForm(true);
  }

  function openEdit(t) {
    setForm({
      team_name: t.team_name || '', played: String(t.played || 0), won: String(t.won || 0),
      drawn: String(t.drawn || 0), lost: String(t.lost || 0),
      goals_for: String(t.goals_for || 0), goals_against: String(t.goals_against || 0),
      points: String(t.points || 0),
    });
    setEditTeam(t);
    setShowForm(true);
  }

  async function saveTeam(e) {
    e.preventDefault();
    if (!form.team_name.trim()) { toastError('اسم الفريق مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_id: entityId, provider_name: dataOwnerName,
        team_name: form.team_name.trim(),
        played: Number(form.played) || 0, won: Number(form.won) || 0,
        drawn: Number(form.drawn) || 0, lost: Number(form.lost) || 0,
        goals_for: Number(form.goals_for) || 0, goals_against: Number(form.goals_against) || 0,
        points: Number(form.points) || 0,
      };
      if (editTeam) {
        const { error } = await supabase.from('sports_standings').update(payload).eq('id', editTeam.id);
        if (error) throw error;
        success('✅ تم التعديل');
      } else {
        const { error } = await supabase.from('sports_standings').insert(payload);
        if (error) throw error;
        success('🎉 تم إضافة الفريق');
      }
      setShowForm(false);
      loadStandings();
    } catch (err) { console.error(err); toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  async function deleteTeam(t) {
    if (!confirm(`حذف فريق "${t.team_name}"؟`)) return;
    const { error } = await supabase.from('sports_standings').delete().eq('id', t.id);
    if (!error) { success('🗑️ تم الحذف'); setStandings(prev => prev.filter(x => x.id !== t.id)); }
  }

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>📊 الترتيب</h1>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{dataOwnerName}</div>
          </div>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <Link href="/merchant/sports_matches" style={navStyle(false)}>⚽ المباريات</Link>
        <Link href="/merchant/sports_players" style={navStyle(false)}>👥 اللاعبون</Link>
        <Link href="/merchant/sports_standings" style={navStyle(true)}>📊 الترتيب</Link>
      </div>

      <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>
        {standings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>لا يوجد ترتيب بعد</div>
            <button onClick={openAdd} style={{ background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ أضف فريقاً</button>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: 8, textAlign: 'right', fontSize: 10, color: '#64748b', fontWeight: 900 }}>#</th>
                  <th style={{ padding: 8, textAlign: 'right', fontSize: 10, color: '#64748b', fontWeight: 900 }}>الفريق</th>
                  <th style={{ padding: 8, textAlign: 'center', fontSize: 10, color: '#64748b', fontWeight: 900 }}>لعب</th>
                  <th style={{ padding: 8, textAlign: 'center', fontSize: 10, color: '#64748b', fontWeight: 900 }}>فاز</th>
                  <th style={{ padding: 8, textAlign: 'center', fontSize: 10, color: '#64748b', fontWeight: 900 }}>تعادل</th>
                  <th style={{ padding: 8, textAlign: 'center', fontSize: 10, color: '#64748b', fontWeight: 900 }}>خسر</th>
                  <th style={{ padding: 8, textAlign: 'center', fontSize: 10, color: '#64748b', fontWeight: 900 }}>نقاط</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 8, fontSize: 12, fontWeight: 900, color: i === 0 ? '#10b981' : i === 1 ? '#f59e0b' : i === 2 ? '#d97706' : '#64748b' }}>{i + 1}</td>
                    <td style={{ padding: 8, fontSize: 12, fontWeight: 900, color: '#0f172a' }}>
                      {t.team_name}
                      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        <button onClick={() => openEdit(t)} style={{ padding: '2px 6px', background: 'rgba(14,165,233,0.1)', color: '#0284c7', border: 'none', borderRadius: 4, fontSize: 9, cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => deleteTeam(t)} style={{ padding: '2px 6px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 4, fontSize: 9, cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </td>
                    <td style={{ padding: 8, fontSize: 12, textAlign: 'center', color: '#475569' }}>{t.played}</td>
                    <td style={{ padding: 8, fontSize: 12, textAlign: 'center', color: '#10b981' }}>{t.won}</td>
                    <td style={{ padding: 8, fontSize: 12, textAlign: 'center', color: '#f59e0b' }}>{t.drawn}</td>
                    <td style={{ padding: 8, fontSize: 12, textAlign: 'center', color: '#ef4444' }}>{t.lost}</td>
                    <td style={{ padding: 8, fontSize: 14, textAlign: 'center', fontWeight: 900, color: '#0f4d3a' }}>{t.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 20px' }}>{editTeam ? '✏️ تعديل فريق' : '📊 فريق جديد'}</h2>
            <form onSubmit={saveTeam}>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>اسم الفريق *</label><input value={form.team_name} onChange={e => setForm({ ...form, team_name: e.target.value })} required style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div><label style={labelStyle}>لعب</label><input type="number" value={form.played} onChange={e => setForm({ ...form, played: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>فاز</label><input type="number" value={form.won} onChange={e => setForm({ ...form, won: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>تعادل</label><input type="number" value={form.drawn} onChange={e => setForm({ ...form, drawn: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>خسر</label><input type="number" value={form.lost} onChange={e => setForm({ ...form, lost: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>له</label><input type="number" value={form.goals_for} onChange={e => setForm({ ...form, goals_for: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>عليه</label><input type="number" value={form.goals_against} onChange={e => setForm({ ...form, goals_against: e.target.value })} style={inputStyle} /></div>
              </div>
              <div style={{ marginBottom: 20 }}><label style={labelStyle}>النقاط</label><input type="number" value={form.points} onChange={e => setForm({ ...form, points: e.target.value })} style={inputStyle} /></div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function navStyle(active) { return { background: active ? '#0f4d3a' : '#fff', color: active ? '#fff' : '#64748b', border: active ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap' }; }
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
