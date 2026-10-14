'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function MerchantReviewsPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) return;
    const { data } = await supabase.from('reviews').select('*').eq('target_type', 'entity').eq('target_name', ent.display_name).order('created_at', { ascending: false });
    setReviews(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openReply(r) {
    setReplying(r);
    setReplyText(r.entity_reply || '');
  }

  async function saveReply() {
    if (!replyText.trim()) { alert('الرد مطلوب'); return; }
    setSaving(true);
    const { error } = await supabase.from('reviews').update({ entity_reply: replyText.trim(), replied_at: new Date().toISOString() }).eq('id', replying.id);
    setSaving(false);
    if (error) { alert('تعذّر: ' + error.message); return; }
    setReplying(null);
    setReplyText('');
    load(entity);
  }

  async function reportReview(r) {
    const reason = prompt('سبب الإبلاغ؟ (محتوى مسيء / تعليق كاذب / إعلان)');
    if (!reason) return;
    await supabase.from('reviews').update({ is_reported: true, report_reason: reason }).eq('id', r.id);
    alert('✅ تم إرسال الإبلاغ للإدارة');
    load(entity);
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  const filtered = filter === 'all' ? reviews : filter === 'unreplied' ? reviews.filter((r) => !r.entity_reply) : reviews.filter((r) => r.entity_reply);

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">⭐ التقييمات</span>
        <span className="mng-count">{reviews.length}</span>
      </div>

      <div className="store-cat-scroll" style={{ paddingTop: 14 }}>
        <button className={`store-cat-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} type="button">الكل</button>
        <button className={`store-cat-chip ${filter === 'unreplied' ? 'active' : ''}`} onClick={() => setFilter('unreplied')} type="button">بدون رد</button>
        <button className={`store-cat-chip ${filter === 'replied' ? 'active' : ''}`} onClick={() => setFilter('replied')} type="button">مع رد</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty"><span className="em">⭐</span><p>لا توجد تقييمات</p></div>
      ) : (
        <div style={{ padding: 20 }}>
          {filtered.map((r) => (
            <div key={r.id} className="debt-card" style={{ borderRightColor: r.rating >= 4 ? '#16a34a' : r.rating >= 3 ? '#f59e0b' : '#dc2626' }}>
              <div className="debt-head">
                <div>
                  <div className="debt-customer">👤 {r.reviewer_name}</div>
                  <div style={{ fontSize: 13, color: '#f59e0b', marginTop: 3 }}>
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </div>
                </div>
                {r.is_reported && (
                  <span style={{ padding: '3px 8px', borderRadius: 999, fontSize: 10, fontWeight: 900, background: 'rgba(220,38,38,.15)', color: '#dc2626' }}>
                    🚩 مُبلّغ
                  </span>
                )}
              </div>
              {r.comment && (
                <div style={{ fontSize: 13, color: 'var(--n-700)', lineHeight: 1.7, marginTop: 8, padding: 10, background: 'var(--c-50)', borderRadius: 10 }}>
                  {r.comment}
                </div>
              )}
              {r.entity_reply && (
                <div style={{ marginTop: 10, padding: 10, background: 'rgba(14,138,102,.08)', borderRight: '3px solid var(--f-600)', borderRadius: 10 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--f-700)', marginBottom: 4 }}>↩️ ردك</div>
                  <div style={{ fontSize: 12.5, color: 'var(--f-700)', lineHeight: 1.6 }}>{r.entity_reply}</div>
                </div>
              )}
              <div style={{ fontSize: 10.5, color: 'var(--n-400)', marginTop: 8 }}>
                {new Date(r.created_at).toLocaleDateString('ar-EG')}
              </div>
              <div className="debt-actions">
                <button className="debt-action edit" onClick={() => openReply(r)} type="button">
                  {r.entity_reply ? '✏️ تعديل الرد' : '↩️ رد'}
                </button>
                {!r.is_reported && (
                  <button className="debt-action del" onClick={() => reportReview(r)} type="button">🚩 إبلاغ</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {replying && (
        <div className="mng-modal-bg" onClick={() => setReplying(null)}>
          <div className="mng-modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">↩️ الرد على التقييم</h3>
            <div style={{ background: 'var(--c-50)', padding: 12, borderRadius: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{replying.reviewer_name} — {'★'.repeat(replying.rating)}</div>
              {replying.comment && <div style={{ fontSize: 12, color: 'var(--n-500)' }}>{replying.comment}</div>}
            </div>
            <div className="new-service-field">
              <label className="new-service-label">ردك</label>
              <textarea className="new-service-textarea" rows={4} value={replyText} onChange={(ev) => setReplyText(ev.target.value)} placeholder="شكراً لتقييمك..." />
            </div>
            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setReplying(null)} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={saveReply} disabled={saving} type="button">{saving ? '...' : '✓ حفظ الرد'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
