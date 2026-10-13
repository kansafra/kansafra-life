'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Comments({ targetType, targetId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, [targetType, targetId]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(30);
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;
    setSubmitting(true);
    await supabase.from('comments').insert({
      target_type: targetType,
      target_id: targetId,
      author_name: name.trim(),
      body: body.trim(),
    });
    setName(''); setBody('');
    setSubmitting(false);
    load();
  }

  return (
    <div className="detail-section">
      <div className="detail-section-title">التعليقات ({items.length})</div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        <input
          className="new-service-input"
          placeholder="اسمك"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="new-service-textarea"
          placeholder="اكتب تعليقًا..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ minHeight: 70 }}
        />
        <button className="new-service-submit" type="submit" disabled={submitting} style={{ padding: 12, fontSize: 13.5 }}>
          {submitting ? '... جارٍ' : 'نشر التعليق'}
        </button>
      </form>

      <div className="detail-card">
        {loading ? (
          <div className="ol-empty-state"><p>جارٍ التحميل...</p></div>
        ) : items.length === 0 ? (
          <div className="ol-empty-state"><p>لا توجد تعليقات — كن الأول</p></div>
        ) : (
          items.map((c) => (
            <div key={c.id} className="comment-item">
              <div className="comment-head">
                <div className="comment-avatar">{(c.author_name || '؟').charAt(0)}</div>
                <div className="comment-info">
                  <div className="comment-author">{c.author_name}</div>
                  <div className="comment-date">
                    {new Date(c.created_at).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div className="comment-body">{c.body}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
