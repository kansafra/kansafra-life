'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import ImageUploader from '@/components/ImageUploader';

export default function NewAuctionPage() {
  const router = useRouter();
  const { dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [form, setForm] = useState({ title: '', description: '', starting_price: '', min_increment: 100, currency: 'SYP', ends_at: '', image_url: '' });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.title?.trim()) { tE('العنوان مطلوب'); return; }
    if (!form.starting_price || Number(form.starting_price) <= 0) { tE('السعر الابتدائي مطلوب'); return; }
    if (!form.ends_at) { tE('تاريخ الانتهاء مطلوب'); return; }
    if (new Date(form.ends_at) <= new Date()) { tE('تاريخ الانتهاء يجب أن يكون في المستقبل'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from('auctions').insert({
        seller_name: dataOwnerName,
        seller_phone: null,
        title: form.title.trim(),
        description: form.description?.trim() || null,
        starting_price: Number(form.starting_price),
        current_price: Number(form.starting_price),
        min_increment: Number(form.min_increment) || 100,
        currency: form.currency || 'SYP',
        ends_at: new Date(form.ends_at).toISOString(),
        image_url: form.image_url || null,
        status: 'active',
        bid_count: 0,
      });
      if (error) throw error;
      success('✅ تم إنشاء المزاد');
      router.push('/merchant/auctions');
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant/auctions" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>←</Link>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>🏆 مزاد جديد</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>عنوان المزاد *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: ساعة يد أصلية" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>الوصف</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="اشرح المنتج..." style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>السعر الابتدائي *</label>
              <input type="number" value={form.starting_price} onChange={(e) => setForm({ ...form, starting_price: e.target.value })} placeholder="0" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>العملة</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}>
                <option value="SYP">SYP</option><option value="USD">USD</option><option value="TRY">TRY</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>الحد الأدنى للزيادة</label>
              <input type="number" value={form.min_increment} onChange={(e) => setForm({ ...form, min_increment: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>ينتهي في *</label>
              <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <ImageUploader label="📸 صورة المنتج" folder="auctions" value={form.image_url} onUpload={(url) => setForm({ ...form, image_url: url })} />
          </div>

          <button onClick={save} disabled={saving} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? '... جارٍ النشر' : '✓ نشر المزاد'}
          </button>
        </div>
      </div>
    </div>
  );
}
