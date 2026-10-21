'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { addToCart } from '@/lib/cart';

const TYPE_LABELS = {
  merchant: '🏪 متجر', restaurant: '🍽️ مطعم', doctor: '👨‍⚕️ طبيب',
  pharmacy: '💊 صيدلية', school: '🏫 مدرسة', mosque: '🕌 جامع',
  charity: '🤝 جمعية', sports: '⚽ نادي', hotel: '🏨 فندق',
  office: '📁 مكتب', exchange: '💱 صرافة', transport: '🚗 مواصلات',
  memory: '📸 ذاكرة', municipality: '🏢 بلدية', craftsman: '🛠️ حرفي',
  workshop: '🏭 ورشة', isp: '📡 إنترنت', council: '🏛️ مجلس',
};

export default function StorePage() {
  const { provider } = useParams();
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const storeName = decodeURIComponent(provider || '');
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!storeName) return;
    loadStore();
  }, [storeName]);

  async function loadStore() {
    if (!supabase) return;
    setLoading(true);
    try {
      // ١. جلب بيانات المتجر
      const { data: ent } = await supabase
        .from('entities')
        .select('*')
        .eq('display_name', storeName)
        .maybeSingle();

      if (!ent) { setLoading(false); return; }
      setStore(ent);

      // ٢. جلب المنتجات
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .eq('entity_id', ent.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setProducts(prods || []);

      // ٣. جلب التقييمات (إن وجدت)
      try {
        const { data: revs } = await supabase
          .from('reviews')
          .select('*')
          .eq('entity_id', ent.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(10);
        setReviews(revs || []);
      } catch {}
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart(product) {
    addToCart({
      id: product.id,
      title: product.title,
      price: Number(product.price),
      currency: product.currency || 'SYP',
      image: product.image_url,
      provider_name: store?.display_name || 'متجر',
      provider_id: store?.id,
      qty: 1,
    });
    success('تمت الإضافة للسلة 🛒');
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const stats = useMemo(() => {
    const avgRating = reviews.length > 0
      ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
      : null;
    return {
      productCount: products.length,
      avgRating,
      reviewCount: reviews.length,
    };
  }, [products, reviews]);

  const isOpen = store?.is_active !== false && store?.approval_status === 'approved';
  const isPending = store?.approval_status === 'pending';
  const isRejected = store?.approval_status === 'rejected';

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  if (!store) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🏪</div>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>المتجر غير موجود</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>تأكد من الرابط أو ابحث عنه</p>
        <Link href="/stores" style={{ display: 'inline-block', padding: '12px 24px', background: '#0f4d3a', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 900, fontSize: 13 }}>تصفح المتاجر</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      
      {/* Hero Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '20px', paddingBottom: 40, color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <button onClick={() => router.back()} style={{ color: '#fff', background: 'rgba(255,255,255,0.15)', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>←</button>
          <Link href="/cart" style={{ color: '#fff', background: 'rgba(255,255,255,0.15)', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 18 }}>🛒</Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.display_name} style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', border: '3px solid rgba(255,255,255,0.3)', background: '#fff' }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
              {TYPE_LABELS[store.entity_type]?.split(' ')[0] || '🏪'}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {store.display_name}
              </h1>
              {store.is_verified && <span style={{ fontSize: 16 }}>✅</span>}
            </div>
            <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>
              {TYPE_LABELS[store.entity_type] || store.entity_type || 'نشاط'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, opacity: 0.9, flexWrap: 'wrap' }}>
              {store.city && <span>📍 {store.city}</span>}
              {stats.avgRating && <span>⭐ {stats.avgRating} ({stats.reviewCount})</span>}
              <span style={{ color: isOpen ? '#86efac' : '#fca5a5', fontWeight: 900 }}>
                ● {isPending ? 'قيد المراجعة' : isRejected ? 'مرفوض' : isOpen ? 'مفتوح' : 'مغلق'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16, marginTop: -24, position: 'relative', zIndex: 2 }}>
        
        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {store.phone && (
            <a href={`tel:${store.phone}`} style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, textAlign: 'center', textDecoration: 'none', color: '#0f172a', fontSize: 12, fontWeight: 900 }}>
              📞 اتصال
            </a>
          )}
          {store.whatsapp && (
            <a href={`https://wa.me/${(store.whatsapp || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ flex: 1, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 12, padding: 12, textAlign: 'center', textDecoration: 'none', color: '#25D366', fontSize: 12, fontWeight: 900 }}>
              💬 واتساب
            </a>
          )}
          <button onClick={() => setShowInfo(!showInfo)} style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, textAlign: 'center', color: '#0f172a', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
            {showInfo ? '✕ إغلاق' : 'ℹ️ معلومات'}
          </button>
        </div>

        {/* Info Panel */}
        {showInfo && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0', marginBottom: 16 }}>
            {store.description && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 900, marginBottom: 4 }}>📝 عن المتجر</div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{store.description}</div>
              </div>
            )}
            {store.address && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 900, marginBottom: 4 }}>📍 العنوان</div>
                <div style={{ fontSize: 13, color: '#475569' }}>{store.address}</div>
              </div>
            )}
            {store.working_hours && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 900, marginBottom: 4 }}>⏰ ساعات العمل</div>
                <div style={{ fontSize: 13, color: '#475569' }}>{store.working_hours}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {store.delivery_fee != null && Number(store.delivery_fee) > 0 && (
                <span style={{ background: 'rgba(14,165,233,0.1)', color: '#0284c7', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>🚚 توصيل: {store.delivery_fee} ل.س</span>
              )}
              {store.min_order != null && Number(store.min_order) > 0 && (
                <span style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>📦 حد أدنى: {store.min_order} ل.س</span>
              )}
              {store.accepts_cash !== false && (
                <span style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>💵 نقدي</span>
              )}
              {store.lat && store.lng && (
                <a href={`https://www.google.com/maps?q=${store.lat},${store.lng}`} target="_blank" rel="noreferrer" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900, textDecoration: 'none' }}>🗺️ الموقع</a>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <input
          type="search"
          placeholder={`🔍 ابحث في ${store.display_name}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff', marginBottom: 16, fontFamily: 'inherit' }}
        />

        {/* Products Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>🛍️ المنتجات</h2>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 800 }}>{filtered.length} {filtered.length === 1 ? 'منتج' : 'منتجات'}</span>
        </div>

        {/* Products Grid */}
        {!isOpen && !isPending && (
          <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, padding: 20, textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#991b1b', marginBottom: 4 }}>المتجر مغلق حالياً</div>
            <div style={{ fontSize: 12, color: '#7f1d1d' }}>يمكنك تصفح المنتجات لكن لا يمكن الطلب الآن</div>
          </div>
        )}

        {isPending && (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 16, padding: 20, textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>⏳</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#92400e', marginBottom: 4 }}>قيد المراجعة</div>
            <div style={{ fontSize: 12, color: '#92400e' }}>هذا المتجر لم يُعتمد بعد من الإدارة</div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 6 }}>
              {products.length === 0 ? 'لا توجد منتجات بعد' : 'لا توجد نتائج مطابقة'}
            </div>
            <div style={{ fontSize: 12 }}>{products.length === 0 ? 'سيضيف التاجر منتجاته قريباً' : `لم نجد "${search}"`}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {filtered.map(p => {
              const price = Number(p.price) || 0;
              const disc = Number(p.discount_percent) || 0;
              const finalPrice = Math.round(price - (price * disc / 100));
              const outOfStock = Number(p.stock) === 0;

              return (
                <div key={p.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', opacity: outOfStock ? 0.6 : 1 }}>
                  <Link href={`/product/${p.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ position: 'relative' }}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} style={{ width: '100%', height: 140, objectFit: 'cover', background: '#f1f5f9' }} />
                      ) : (
                        <div style={{ width: '100%', height: 140, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📦</div>
                      )}
                      {disc > 0 && (
                        <div style={{ position: 'absolute', top: 6, left: 6, background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>
                          -{disc}%
                        </div>
                      )}
                      {outOfStock && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 900 }}>
                          نفد المخزون
                        </div>
                      )}
                    </div>
                    <div style={{ padding: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#0f4d3a' }}>{finalPrice.toLocaleString()}</div>
                        <div style={{ fontSize: 9, color: '#64748b' }}>{p.currency || 'SYP'}</div>
                        {disc > 0 && <div style={{ fontSize: 10, color: '#94a3b8', textDecoration: 'line-through' }}>{price.toLocaleString()}</div>}
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleAddToCart(p)}
                    disabled={outOfStock || !isOpen}
                    style={{ width: '100%', padding: 10, background: outOfStock || !isOpen ? '#f1f5f9' : 'rgba(16,185,129,0.1)', color: outOfStock || !isOpen ? '#94a3b8' : '#059669', border: 'none', borderTop: '1px solid #f1f5f9', fontSize: 11, fontWeight: 900, cursor: outOfStock || !isOpen ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                  >
                    {outOfStock ? 'نفد' : !isOpen ? 'مغلق' : '🛒 أضف'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
