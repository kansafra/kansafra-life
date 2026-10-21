'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'sanad_salt_v1');
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generatePassword(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let p = '';
  for (let i = 0; i < length; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
  return p;
}

export default function PasswordRequestsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [working, setWorking] = useState(null);
  const [newPasswords, setNewPasswords] = useState({});

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!admin) { router.replace('/admin/login'); return; }
    loadRequests();
  }, [router]);

  async function loadRequests() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('password_reset_requests')
        .select('*')
        .order('created_at', { ascending: false });
      setRequests(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleReset(req) {
    if (!req.user_id) { toastError('المستخدم غير موجود'); return; }
    if (!confirm(`إعادة تعيين كلمة مرور "${req.name}"؟`)) return;

    setWorking(req.id);
    try {
      const newPassword = generatePassword(8);
      const hashed = await hashPassword(newPassword);

      const table = req.user_type === 'customer' ? 'customers' : 'entities';
      const { error: updateErr } = await supabase.from(table).update({ password_hash: hashed }).eq('id', req.user_id);
      if (updateErr) throw updateErr;

      const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
      const { error: reqErr } = await supabase.from('password_reset_requests').update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: admin?.username || 'admin',
        new_password_temp: newPassword,
      }).eq('id', req.id);
      if (reqErr) throw reqErr;

      setNewPasswords(prev => ({ ...prev, [req.id]: newPassword }));
      success('✅ تم إعادة التعيين');
      loadRequests();
    } catch (err) {
      console.error(err);
      toastError('فشل إعادة التعيين');
    } finally { setWorking(null); }
  }

  async function copyPassword(pw) {
    try {
      await navigator.clipboard.writeText(pw);
      success('📋 تم نسخ كلمة المرور');
    } catch {
      prompt('انسخ كلمة المرور:', pw);
    }
  }

  async function rejectRequest(req) {
    if (!confirm(`رفض طلب "${req.name}"؟`)) return;
    setWorking(req.id);
    const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    const { error } = await supabase.from('password_reset_requests').update({
      status: 'rejected',
      resolved_at: new Date().toISOString(),
      resolved_by: admin?.username || 'admin',
    }).eq('id', req.id);
    if (!error) { success('تم الرفض'); loadRequests(); }
    else toastError('فشل');
    setWorking(null);
  }

  async function deleteRequest(req) {
    if (!confirm('حذف الطلب نهائياً؟')) return;
    setWorking(req.id);
    const { error } = await supabase.from('password_reset_requests').delete().eq('id', req.id);
    if (!error) { success('🗑️ تم الحذف'); setRequests(prev => prev.filter(r => r.id !== req.id)); }
    setWorking(null);
  }

  const filtered = requests.filter(r => filter === 'all' ? true : r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>🔑 طلبات استعادة كلمة المرور</h1>
          {pendingCount > 0 && (
            <div style={{ background: '#ef4444', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>{pendingCount}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{k:'pending', l:'معلقة'},{k:'resolved', l:'معالجة'},{k:'rejected', l:'مرفوضة'},{k:'all', l:'الكل'}].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{ background: filter === f.k ? '#fff' : 'rgba(255,255,255,0.1)', color: filter === f.k ? '#0f172a' : '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{f.l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>لا توجد طلبات {filter === 'pending' ? 'معلقة' : 'في هذا القسم'}</div>
          </div>
        ) : filtered.map(req => {
          const isPending = req.status === 'pending';
          const isResolved = req.status === 'resolved';
          const newPw = newPasswords[req.id] || (isResolved ? req.new_password_temp : null);
          const isWorking = working === req.id;
          const userTypeLabel = req.user_type === 'customer' ? '🛒 زبون' : '🏪 تاجر';
          const phone = (req.phone || '').replace(/[^0-9]/g, '');
          const waText = newPw ? `مرحباً ${req.name}،\nكلمة المرور الجديدة لحسابك على منصة سند:\n${newPw}\n\nيرجى تغييرها بعد الدخول.` : '';

          return (
            <div key={req.id} style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: isPending ? '2px solid #f59e0b' : '1px solid #e2e8f0', opacity: isWorking ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{req.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>📱 {req.phone}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    {userTypeLabel} · {new Date(req.created_at).toLocaleString('ar-SY')}
                  </div>
                </div>
                <div style={{ background: isPending ? 'rgba(245,158,11,0.1)' : isResolved ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: isPending ? '#f59e0b' : isResolved ? '#10b981' : '#ef4444', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap' }}>
                  {isPending ? '⏳ معلق' : isResolved ? '✅ معالج' : '❌ مرفوض'}
                </div>
              </div>

              {req.notes && (
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10, fontSize: 12, color: '#475569', marginBottom: 10 }}>
                  📝 {req.notes}
                </div>
              )}

              {newPw && (
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#059669', fontWeight: 900, marginBottom: 6 }}>🔐 كلمة المرور الجديدة</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, background: '#fff', borderRadius: 8, padding: 10, fontFamily: 'monospace', fontSize: 16, fontWeight: 900, color: '#0f4d3a', letterSpacing: 2, textAlign: 'center' }}>{newPw}</div>
                    <button onClick={() => copyPassword(newPw)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📋 نسخ</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {isPending && (
                  <>
                    <button onClick={() => handleReset(req)} disabled={isWorking} style={{ flex: 1, padding: 10, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: isWorking ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                      {isWorking ? '⏳' : '🔑 إعادة تعيين'}
                    </button>
                    <button onClick={() => rejectRequest(req)} disabled={isWorking} style={{ flex: 1, padding: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: isWorking ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                      ❌ رفض
                    </button>
                  </>
                )}
                {newPw && phone && (
                  <a href={`https://wa.me/${phone}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', padding: 10, background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>
                    💬 إرسال واتساب
                  </a>
                )}
                <button onClick={() => deleteRequest(req)} disabled={isWorking} style={{ padding: '10px 14px', background: 'rgba(148,163,184,0.1)', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: isWorking ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
