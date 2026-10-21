'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function SportsPlayersPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [form, setForm] = useState({ name: '', position: 'مهاجم', jersey_number: '', age: '', phone: '', image_url: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) supabase.from('entities').select('id').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => { if (data) setEntityId(data.id); });
    loadPlayers();
  }, [user, userLoading, dataOwnerName]);

  async function loadPlayers() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('sports_players').select('*').eq('provider_name', dataOwnerName).order('jersey_number', { ascending: true });
      setPlayers(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm({ name: '', position: 'مهاجم', jersey_number: '', age: '', phone: '', image_url: '' });
    setEditPlayer(null);
    setShowForm(true);
  }

  function openEdit(p) {
    setForm({
      name: p.name || '', position: p.position || 'مهاجم',
      jersey_number: String(p.jersey_number || ''), age: String(p.age || ''),
      phone: p.phone || '', image_url: p.image_url || '',
    });
    setEditPlayer(p);
    setShowForm(true);
  }

  async function uploadImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toastError('حجم الصورة أقل من 5MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const name = `players/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('sanad-files').upload(name, file);
      if (error) throw error;
      const { data: url } = supabase.storage.from('sanad-files').getPublicUrl(name);
      setForm({ ...form, image_url: url.publicUrl });
      success('✅ تم رفع الصورة');
    } catch (err) { toastError('فشل الرفع'); }
    finally { setUploading(false); }
  }

  async function savePlayer(e) {
    e.preventDefault();
    if (!form.name.trim()) { toastError('اسم اللاعب مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_id: entityId, provider_name: dataOwnerName,
        name: form.name.trim(), position: form.position,
        jersey_number: form.jersey_number ? Number(form.jersey_number) : null,
        age: form.age ? Number(form.age) : null, phone: form.phone.trim() || null,
        image_url: form.image_url || null, is_active: true,
      };
      if (editPlayer) {
        const { error } = await supabase.from('sports_players').update(payload).eq('id', editPlayer.id);
        if (error) throw error;
        success('✅ تم التعديل');
      } else {
        const { error } = await supabase.from('sports_players').insert(payload);
        if (error) throw error;
        success('🎉 تم إضافة اللاعب');
      }
      setShowForm(false);
      loadPlayers();
    } catch (err) { console.error(err); toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  async function deletePlayer(p) {
    if (!confirm(`حذف اللاعب "${p.name}"؟`)) return;
    const { error } = await supabase.from('sports_players').delete().eq('id', p.id);
    if (!error) { success('🗑️ تم الحذف'); setPlayers(prev => prev.filter(x => x.id !== p.id)); }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return players;
    const q = search.trim().toLowerCase();
    return players.filter(p => (p.name || '').toLowerCase().includes(q) || (p.position || '').toLowerCase().includes(q));
  }, [players, search]);

  const positions = ['حارس', 'مدافع', 'وسط', 'مهاجم', 'جناح', 'ظهير'];

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>👥 اللاعبون</h1>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{dataOwnerName}</div>
          </div>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
        <input type="search" placeholder="🔍 ابحث بالاسم أو المركز..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <Link href="/merchant/sports_matches" style={navStyle(false)}>⚽ المباريات</Link>
        <Link href="/merchant/sports_players" style={navStyle(true)}>👥 اللاعبون</Link>
        <Link href="/merchant/sports_standings" style={navStyle(false)}>📊 الترتيب</Link>
      </div>

      <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{players.length === 0 ? 'لا يوجد لاعبون' : 'لا نتائج'}</div>
            {players.length === 0 && <button onClick={openAdd} style={{ background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ أضف لاعباً</button>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {filtered.map(p => (
              <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: 12, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, margin: '0 auto 8px' }}>
                  {p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (p.name || '؟').charAt(0)}
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                {p.position && <div style={{ fontSize: 10, color: '#0ea5e9', fontWeight: 900, marginTop: 2 }}>{p.position}</div>}
                {p.jersey_number && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>#{p.jersey_number}</div>}
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                  <button onClick={() => openEdit(p)} style={{ flex: 1, padding: 6, background: 'rgba(14,165,233,0.1)', color: '#0284c7', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => deletePlayer(p)} style={{ flex: 1, padding: 6, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 20px' }}>{editPlayer ? '✏️ تعديل لاعب' : '👥 لاعب جديد'}</h2>
            <form onSubmit={savePlayer}>
              <div style={{ marginBottom: 12, textAlign: 'center' }}>
                <label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'inline-block' }}>
                  <input type="file" accept="image/*" onChange={uploadImage} style={{ display: 'none' }} disabled={uploading} />
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: form.image_url ? '#f1f5f9' : 'rgba(14,165,233,0.1)', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto', overflow: 'hidden' }}>
                    {form.image_url ? <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (uploading ? '⏳' : '📸')}
                  </div>
                </label>
              </div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>الاسم *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={labelStyle}>المركز</label><select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} style={inputStyle}>{positions.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div><label style={labelStyle}>رقم القميص</label><input type="number" value={form.jersey_number} onChange={e => setForm({ ...form, jersey_number: e.target.value })} style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={labelStyle}>العمر</label><input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>الهاتف</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} /></div>
              </div>
              <button type="submit" disabled={saving || uploading} style={{ width: '100%', padding: 14, marginTop: 8, background: '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ'}</button>
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
