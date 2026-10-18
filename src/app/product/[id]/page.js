'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { addToCart } from '@/lib/cart';
import { useToast } from '@/components/Toast';
import Reviews from '@/components/Reviews';
import ReviewsSummary from '@/components/ReviewsSummary';

export default function ProductPage() {
  const router = useRouter();
  const params = useParams();
  const { success, error: tE } = useToast();
  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [imageIdx, setImageIdx] = useState(0);

  useEffect(() => {
    if (params?.id) load(params.id);
  }, [params?.id]);

  async function load(id) {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
      if (!data) { setLoading(false); return; }
      setProduct(data);

      // جلب المتجر
      const { data: ent } = await supabase.from('entities').select('id, display_name, logo_url, phone, city, is_verified').eq('display_name', data.provider_name).maybeSingle();
      setStore(ent);

      // منتجات مشابهة
      const { data: sim } = await supabase.from('products').select('*').eq('category', data.category).eq('is_active', true).neq('id', id).limit(6);
      setSimilar(sim || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function handleAdd() {
    if (!product) return;
    try {
      addToCart({
        id: product.id,
        title: product.title,
        price: getFinalPrice(),
        currency: product.currency || 'SYP',
        image: product.image_url,
        provider_name: product.provider_name,
        qty,
      });
      success(`✅ أضفت ${qty} للسلة`);
    } catch (e) { tE('تعذّر: ' + e.message); }
  }

  function buyNow() {
    handleAdd();
    setTimeout(() => router.push('/cart'), 300);
  }

  function getFinalPrice() {
    if (!product) return 0;
    const price = Number(product.price) || 0;
    const disc = Number(product.discount_percent) || 0;
    return Math.round(price - (price * disc / 100));
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>المنتج غير موجود</div>
          <Link href="/" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 800, marginTop: 16 }}>← الرئيسية</Link>
        </div>
      </div>
    );
  }

  const finalPrice = getFinalPrice();
  const hasDiscount = Number(product.discount_percent) > 0;
  const images = [product.image_url].filter(Boolean);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: '#f1f5f9', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>→</button>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</div>
        <button onClick={() => router.push('/cart')} style={{ background: '#f1f5f9', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>🛒</button>
      </div>

      {/* Image */}
      <div style={{ background: '#fff', paddingBottom: 8 }}>
        <div style={{ position: 'relative', paddingBottom: '75%', background: '#f1f5f9', overflow: 'hidden' }}>
          {images.length > 0 ? (
            <img src={images[imageIdx]} alt={product.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>📦</div>
          )}
          {hasDiscount && (
            <div style={{ position: 'absolute', top: 16, right: 16, background: '#ef4444', color: '#fff', padding: '6px 12px', borderRadius: 10, fontSize: 13, fontWeight: 900 }}>
              خصم {product.discount_percent}%
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ background: '#fff', padding: 16, marginBottom: 8 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8, lineHeight: 1.4 }}>{product.title}</h1>
        
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0f4d3a' }}>{finalPrice.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>{product.currency || 'SYP'}</div>
          {hasDiscount && <div style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'line-through' }}>{Number(product.price).toLocaleString()}</div>}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {product.category && <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>📂 {product.category}</span>}
          {product.stock > 0 ? <span style={{ background: 'rgba(16,185,129,.15)', color: '#10b981', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>✓ متوفر ({product.stock})</span> : <span style={{ background: 'rgba(220,38,38,.1)', color: '#dc2626', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>✕ غير متوفر</span>}
        </div>

        {product.description && (
          <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>📝 الوصف</div>
            <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.7, margin: 0 }}>{product.description}</p>
          </div>
        )}

        {product.file_url && (
          <a href={product.file_url} target="_blank" rel="noopener" style={{ display: 'inline-block', padding: '10px 16px', background: 'rgba(59,130,246,.1)', color: '#3b82f6', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>📎 تحميل الملف</a>
        )}
      </div>

      {/* Store Card */}
      {store && (
        <Link href={`/store/${encodeURIComponent(store.display_name)}`} style={{ display: 'block', background: '#fff', padding: 16, marginBottom: 8, textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {store.logo_url ? (
              <img src={store.logo_url} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg,#0f4d3a,#075640)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🏪</div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 900 }}>{store.display_name}</span>
                {store.is_verified && <span style={{ fontSize: 12 }}>✅</span>}
              </div>
              {store.city && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📍 {store.city}</div>}
            </div>
            <div style={{ fontSize: 12, color: '#10b981', fontWeight: 900 }}>زيارة ←</div>
          </div>
        </Link>
      )}

      {/* Reviews */}
      <div style={{ background: '#fff', padding: 16, marginBottom: 8 }}>
        <Reviews targetType="product" targetId={product.id} targetName={product.title} />
      </div>

      {/* Similar Products */}
      {similar.length > 0 && (
        <div style={{ background: '#fff', padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 12 }}>🛍️ منتجات مشابهة</div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {similar.map(s => {
              const sp = Number(s.price) || 0;
              const sd = Number(s.discount_percent) || 0;
              const spFinal = Math.round(sp - (sp * sd / 100));
              return (
                <Link key={s.id} href={`/product/${s.id}`} style={{ flexShrink: 0, width: 140, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}>
                  {s.image_url ? <img src={s.image_url} alt="" style={{ width: '100%', height: 100, objectFit: 'cover' }} /> : <div style={{ height: 100, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📦</div>}
                  <div style={{ padding: 8 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#0f4d3a' }}>{spFinal.toLocaleString()} <span style={{ fontSize: 9 }}>{s.currency || 'SYP'}</span></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: 12, display: 'flex', gap: 10, boxShadow: '0 -4px 12px rgba(0,0,0,.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 12 }}>
          <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 40, height: 48, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', fontFamily: 'inherit' }}>−</button>
          <div style={{ width: 40, textAlign: 'center', fontSize: 15, fontWeight: 900 }}>{qty}</div>
          <button onClick={() => setQty(qty + 1)} style={{ width: 40, height: 48, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', fontFamily: 'inherit' }}>+</button>
        </div>
        <button onClick={handleAdd} disabled={product.stock === 0} style={{ flex: 1, padding: 14, background: product.stock === 0 ? '#94a3b8' : 'rgba(16,185,129,.15)', color: product.stock === 0 ? '#fff' : '#10b981', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: product.stock === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>🛒 أضف للسلة</button>
        <button onClick={buyNow} disabled={product.stock === 0} style={{ flex: 1, padding: 14, background: product.stock === 0 ? '#94a3b8' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: product.stock === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>⚡ اشتر الآن</button>
      </div>
    </div>
  );
}
