'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { addToCart } from '@/lib/cart';

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [distance, setDistance] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Review state
  const [customer, setCustomer] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      setCustomer(c);
    } catch {}
    loadData();
  }, [id]);

  async function loadData() {
    if (!supabase || !id) return;
    setLoading(true);
    try {
      // ١. جلب المنتج
      const { data: prod } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
      if (!prod) { setLoading(false); return; }
      setProduct(prod);

      // ٢. جلب المتجر + المسافة
      if (prod.entity_id) {
        const { data: ent } = await supabase.from('entities').select('*').eq('id', prod.entity_id).maybeSingle();
        if (ent) {
          setStore(ent);
          try {
            const loc = JSON.parse(localStorage.getItem('sanad_location') || 'null');
            if (loc && ent.lat && ent.lng) {
              const dist = getDistanceFromLatLonInKm(loc.lat, loc.lng, ent.lat, ent.lng);
              setDistance(dist);
              if (dist) setDeliveryFee(Math.ceil(Number(dist) / 5) * 2);
            }
          } catch {}

          // ٣. منتجات مشابهة
          const { data: rel } = await supabase
            .from('products')
            .select('*')
            .eq('entity_id', ent.id)
            .eq('is_active', true)
            .neq('id', id)
            .limit(6);
          setRelated(rel || []);
        }
      }

      // ٤. التقييمات
      try {
        const { data: revs } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', id)
          .order('created_at', { ascending: false })
          .limit(20);
        setReviews(revs || []);
      } catch {}
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function handleAddToCart() {
    if (!product) return;
    addToCart({
      id: product.id,
      title: product.title,
      price: Number(product.price),
      currency: product.currency || 'SYP',
      image: product.image_url,
      provider_name: store?.display_name || 'متجر',
      provider_id: store?.id,
      qty: qty,
    });
    success('تمت الإضافة للسلة 🛒');
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push('/cart');
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!customer) { toastError('يرجى تسجيل الدخول لإضافة تقييم'); return; }
    if (!reviewComment.trim()) { toastError('اكتب تعليقك'); return; }
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: id,
        entity_id: product.entity_id,
        customer_id: customer.id,
        customer_name: customer.name || customer.phone,
        rating: reviewRating,
        comment: reviewComment,
        status: 'approved',
      });
      if (error) throw error;
      success('✅ شكراً على تقييمك!');
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      loadData();
    } catch (err) {
      console.error(err);
      toastError('فشل إرسال التقييم');
    } finally { setSubmittingReview(false); }
  }

  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, count: 0 };
    const avg = (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1);
    return { avg, count: reviews.length };
  }, [reviews]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;
  if (!product) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>📦</div>
        <h2 style={{ fontSize: 18, fontWeight: 900 }}>المنتج غير موجود</h2>
        <Link href="/stores" style={{ display: 'inline-block', marginTop: 16, padding: '12px 24px', background: '#0f4d3a', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 900 }}>تصفح المتاجر</Link>
      </div>
    );
  }

  const price = Number(product.price) || 0;
  const disc = Number(product.discount_percent) || 0;
  const finalPrice = Math.round(price - (price * disc / 100));
  const outOfStock = Number(product.stock) === 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      
      {/* Header Buttons */}
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>←</button>
        <Link href="/cart" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>🛒</Link>
      </div>

      {/* Product Image */}
      <div style={{ background: '#fff', position: 'relative' }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} style={{ width: '100%', height: 380, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: 380, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>📦</div>
        )}
        {disc > 0 && (
          <div style={{ position: 'absolute', top: 16, left: 16, background: '#ef4444', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 900 }}>
            -{disc}% خصم
          </div>
        )}
      </div>

      <div style={{ padding: 16 }}>
        
        {/* Title + Price */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginTop: -30, position: 'relative', zIndex: 5, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 12px 0', lineHeight: 1.4 }}>{product.title}</h1>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#0f4d3a' }}>{finalPrice.toLocaleString()} <span style={{ fontSize: 14 }}>{product.currency || 'SYP'}</span></span>
            {disc > 0 && <span style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'line-through' }}>{price.toLocaleString()}</span>}
          </div>
          {stats.count > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <span style={{ color: '#fbbf24', fontSize: 16 }}>{'★'.repeat(Math.round(Number(stats.avg)))}</span>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>{stats.avg} ({stats.count})</span>
            </div>
          )}
        </div>

        {/* Store Card */}
        {store && (
          <Link href={`/store/${encodeURIComponent(store.display_name)}`} style={{ display: 'block', background: '#fff', borderRadius: 20, padding: 16, marginTop: 12, border: '1px solid #e2e8f0', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {store.logo_url ? (
                <img src={store.logo_url} alt="" style={{ width: 50, height: 50, borderRadius: 12, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 50, height: 50, borderRadius: 12, background: '#0f4d3a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏪</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{store.display_name}</div>
                  {store.is_verified && <span style={{ fontSize: 12, color: '#10b981' }}>✅</span>}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', gap: 10 }}>
                  {distance && <span>📍 يبعد {distance} كم</span>}
                  {store.city && <span>🏙️ {store.city}</span>}
                </div>
              </div>
              <div style={{ color: '#94a3b8', fontSize: 18 }}>←</div>
            </div>
          </Link>
        )}

        {/* Delivery Info */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 16, marginTop: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🚚</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>التوصيل متاح</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                {deliveryFee > 0 ? `تكلفة تقريبية: ~${deliveryFee} ${product.currency || 'SYP'}` : 'التوصيل يعتمد على موقعك'}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginTop: 12, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: 15, fontWeight: 900, marginTop: 0, marginBottom: 12, color: '#0f172a' }}>📝 الوصف</h3>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
            {product.description || 'لا يوجد وصف لهذا المنتج.'}
          </p>
        </div>

        {/* Reviews */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginTop: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0, color: '#0f172a' }}>⭐ التقييمات</h3>
              {stats.count > 0 && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{stats.avg} من 5 · {stats.count} تقييم</div>}
            </div>
            <button onClick={() => setShowReviewForm(!showReviewForm)} style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.3)', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
              {showReviewForm ? '✕ إغلاق' : '+ أضف تقييم'}
            </button>
          </div>

          {/* Add Review Form */}
          {showReviewForm && (
            <form onSubmit={submitReview} style={{ background: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 900, color: '#475569', display: 'block', marginBottom: 6 }}>تقييمك</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onClick={() => setReviewRating(star)} style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: star <= reviewRating ? '#fbbf24' : '#e2e8f0', padding: 0 }}>
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="شاركنا تجربتك مع هذا المنتج..."
                style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontFamily: 'inherit', height: 80, resize: 'none', boxSizing: 'border-box', outline: 'none' }}
                required
              />
              <button type="submit" disabled={submittingReview} style={{ width: '100%', padding: 12, marginTop: 10, background: submittingReview ? '#94a3b8' : '#10b981', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: submittingReview ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {submittingReview ? '⏳ جارٍ الإرسال...' : '📤 نشر التقييم'}
              </button>
              {!customer && (
                <div style={{ fontSize: 11, color: '#ef4444', marginTop: 8, textAlign: 'center' }}>
                  💡 سجّل دخولك أولاً من <Link href="/login" style={{ color: '#0ea5e9', fontWeight: 900 }}>هنا</Link>
                </div>
              )}
            </form>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>
              لا توجد تقييمات بعد — كن أول من يقيّم
            </div>
          ) : (
            reviews.map(rev => (
              <div key={rev.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>👤 {rev.customer_name || 'مستخدم'}</div>
                  <div style={{ color: '#fbbf24', fontSize: 12 }}>{'★'.repeat(rev.rating || 0)}</div>
                </div>
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>{rev.comment}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
                  {rev.created_at ? new Date(rev.created_at).toLocaleDateString('ar-SY') : ''}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>🛍️ منتجات مشابهة</h3>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {related.map(p => (
                <Link key={p.id} href={`/product/${p.id}`} style={{ flexShrink: 0, width: 140, background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', textDecoration: 'none', color: 'inherit' }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt="" style={{ width: '100%', height: 100, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: 100, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</div>
                  )}
                  <div style={{ padding: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#0f4d3a', marginTop: 4 }}>{Number(p.price || 0).toLocaleString()} {p.currency || 'SYP'}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', display: 'flex', gap: 10, zIndex: 50, boxShadow: '0 -10px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 12, padding: '0 8px' }}>
          <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 32, height: 44, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>−</button>
          <div style={{ width: 32, textAlign: 'center', fontSize: 15, fontWeight: 900 }}>{qty}</div>
          <button onClick={() => setQty(qty + 1)} style={{ width: 32, height: 44, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>+</button>
        </div>

        <button onClick={handleAddToCart} disabled={outOfStock} style={{ flex: 1, background: outOfStock ? '#f1f5f9' : '#e0f2fe', color: outOfStock ? '#94a3b8' : '#0284c7', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: outOfStock ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          🛒 أضف للسلة
        </button>

        <button onClick={handleBuyNow} disabled={outOfStock} style={{ flex: 1, background: outOfStock ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: outOfStock ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(15,77,58,0.3)' }}>
          ⚡ اشتر الآن
        </button>
      </div>
    </div>
  );
}
