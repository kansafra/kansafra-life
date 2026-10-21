'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function MerchantLibraryPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    loadBooks();
  }, [user, userLoading, dataOwnerName]);

  async function loadBooks() {
    if (!supabase || !dataOwnerName) return;
    try {
      const { data } = await supabase.from('library_books').select('*').eq('provider_name', dataOwnerName).order('created_at', { ascending: false });
      setBooks(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function toggleActive(book) {
    const { error } = await supabase.from('library_books').update({ is_active: !book.is_active }).eq('id', book.id);
    if (!error) {
      success(book.is_active ? '🙈 مخفي' : '✅ نشط');
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, is_active: !b.is_active } : b));
    }
  }

  async function handleDelete(book) {
    if (!confirm(`حذف "${book.title}"؟`)) return;
    setDeleting(book.id);
    const { error } = await supabase.from('library_books').delete().eq('id', book.id);
    if (!error) { success('🗑️ تم الحذف'); setBooks(prev => prev.filter(b => b.id !== book.id)); }
    setDeleting(null);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return books;
    const q = search.trim().toLowerCase();
    return books.filter(b => (b.title || '').toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q));
  }, [books, search]);

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>📚 مكتبتي</h1>
          <Link href="/merchant/library/new" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ جديد</Link>
        </div>
        <input type="search" placeholder="🔍 ابحث..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{books.length === 0 ? 'لم تنشر أي كتاب' : 'لا نتائج'}</div>
            {books.length === 0 && (
              <Link href="/merchant/library/new" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>+ أضف كتاباً</Link>
            )}
          </div>
        ) : filtered.map(book => (
          <div key={book.id} style={{ background: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, border: '1px solid #e2e8f0', opacity: book.is_active ? 1 : 0.6, display: 'flex', gap: 12 }}>
            <div style={{ width: 60, height: 80, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
              {book.image_url ? <img src={book.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📚</div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
              {book.author && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>✍️ {book.author}</div>}
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => toggleActive(book)} style={{ flex: 1, padding: 8, background: book.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: book.is_active ? '#f59e0b' : '#10b981', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{book.is_active ? '🙈' : '👁️'}</button>
                <button onClick={() => handleDelete(book)} disabled={deleting === book.id} style={{ flex: 1, padding: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{deleting === book.id ? '⏳' : '🗑️'}</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Link href="/merchant/library/new" style={{ position: 'fixed', bottom: 20, left: 20, right: 20, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: 16, borderRadius: 14, textAlign: 'center', textDecoration: 'none', fontSize: 15, fontWeight: 900, boxShadow: '0 10px 30px rgba(16,185,129,0.4)', zIndex: 30 }}>+ إضافة كتاب جديد</Link>
    </div>
  );
}
