'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ShareButtons from '@/components/ShareButtons';

export default function NewsArticle() {
  const params = useParams();
  const id = params?.id;
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      if (!supabase) return;
      const { data } = await supabase.from('news_articles').select('*').eq('id', id).single();
      if (data) {
        setArticle(data);
        // زيادة المشاهدات
        try { await supabase.from('news_articles').update({ views: (data.views || 0) + 1 }).eq('id', id); } catch {}
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;
  if (!article) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">🔍</span><p>الخبر غير موجود</p></div>;

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/news" className="inv-back">→</Link>
        <span className="inv-title">📰 خبر</span>
      </div>

      <div style={{ padding: 20 }}>
        {article.image_url && (
          <img src={article.image_url} alt={article.title} style={{ width: '100%', borderRadius: 18, marginBottom: 16, aspectRatio: '16/9', objectFit: 'cover' }} />
        )}

        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--n-900)', letterSpacing: '-.5px', lineHeight: 1.3, marginBottom: 10 }}>
          {article.title}
        </h1>

        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--n-500)', fontWeight: 700, marginBottom: 20, flexWrap: 'wrap' }}>
          <span>✍️ {article.author_name}</span>
          <span>📅 {new Date(article.published_at || article.created_at).toLocaleDateString('ar-EG')}</span>
          <span>👁️ {article.views || 0} قراءة</span>
        </div>

        {article.excerpt && (
          <div style={{ fontSize: 15, color: 'var(--f-700)', fontWeight: 700, lineHeight: 1.8, padding: 14, background: 'var(--f-50)', borderRight: '4px solid var(--f-600)', borderRadius: 12, marginBottom: 20 }}>
            {article.excerpt}
          </div>
        )}

        <div style={{ fontSize: 15.5, color: 'var(--n-700)', lineHeight: 2, whiteSpace: 'pre-wrap' }}>
          {article.body}
        </div>

        <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid var(--c-200)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--n-700)', marginBottom: 12 }}>📤 شارك الخبر</div>
          <ShareButtons title={article.title} />
        </div>
      </div>
    </div>
  );
}
