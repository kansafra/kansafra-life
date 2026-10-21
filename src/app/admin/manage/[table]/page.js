'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const TABLE_NAMES = {
  products: 'المنتجات', orders: 'الطلبات', customers: 'العملاء',
  debts: 'الديون', announcements: 'الإعلانات', reviews: 'التقييمات',
  jobs: 'الوظائف', appointments: 'المواعيد', blood_donors: 'متبرعو الدم',
  services: 'الخدمات', employees: 'الموظفين'
};

export default function AdminManageTable() {
  const { table } = useParams();
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [editJson, setEditJson] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const tableLabel = TABLE_NAMES[table] || table;

  useEffect(() => {
    // التحقق من صلاحيات الأدمن
    const stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!stored) { router.replace('/admin/login'); return; }
    loadData();
  }, [table, router]);

  async function loadData() {
    if (!supabase) return;
    setLoading(true);
    try {
      let query = supabase.from(table).select('*');
      // محاولة الترتيب حسب تاريخ الإنشاء إذا كان موجوداً
      query = query.order('created_at', { ascending: false });
      
      const { data: res, error } = await query.limit(100);
      
      if (error) {
        // إذا لم يوجد created_at، نجلب بدون ترتيب
        const { data: res2, error: err2 } = await supabase.from(table).select('*').limit(100);
        if (err2) throw err2;
        setData(res2 || []);
      } else {
        setData(res || []);
      }
    } catch (err) {
      console.error(err);
      toastError(`فشل تحميل جدول ${tableLabel}`);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.trim().toLowerCase();
    return data.filter(item => {
      return Object.values(item).some(val => 
        String(val).toLowerCase().includes(q)
      );
    });
  }, [data, search]);

  async function handleSaveEdit() {
    let parsed;
    try {
      parsed = JSON.parse(editJson);
    } catch {
      toastError('صيغة JSON غير صحيحة');
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase.from(table).update(parsed).eq('id', editing.id);
      if (error) throw error;
      success('✅ تم التحديث بنجاح');
      setEditing(null);
      loadData();
    } catch (err) {
      console.error(err);
      toastError('فشل التحديث');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!confirm('هل تريد حذف هذا السجل نهائياً؟')) return;
    setDeleting(item.id);
    const { error } = await supabase.from(table).delete().eq('id', item.id);
    if (error) {
      toastError('فشل الحذف');
    } else {
      success('🗑️ تم الحذف');
      setData(prev => prev.filter(x => x.id !== item.id));
    }
    setDeleting(null);
  }

  // دالة لاستخراج عنوان مناسب للسجل
  function getRecordTitle(item) {
    return item.title || item.name || item.display_name || item.customer_name || 
           item.full_name || item.order_code || item.id?.slice(0, 8) || 'سجل';
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳ جارٍ التحميل...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/admin/manage" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>🗂️ {tableLabel}</h1>
          <div style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '4px 10px', borderRadius: 8, fontWeight: 900 }}>{data.length}</div>
        </div>
        <input 
          type="search" 
          placeholder="🔍 ابحث في السجلات..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} 
        />
      </div>

      <div style={{ padding: 16 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>لا توجد سجلات</div>
          </div>
        ) : (
          filtered.map(item => (
            <div key={item.id} style={{ background: '#fff', borderRadius: 16, marginBottom: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getRecordTitle(item)}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, fontFamily: 'monospace' }}>
                      ID: {item.id?.slice(0, 8)}...
                    </div>
                  </div>
                  {item.created_at && (
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800 }}>
                      {new Date(item.created_at).toLocaleDateString('ar-SY')}
                    </div>
                  )}
                </div>

                {/* عرض سريع لأهم الحقول */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {item.price && <Badge label={`السعر: ${item.price}`} color="#10b981" />}
                  {item.total && <Badge label={`الإجمالي: ${item.total}`} color="#10b981" />}
                  {item.status && <Badge label={`الحالة: ${item.status}`} color="#3b82f6" />}
                  {item.is_active !== undefined && <Badge label={item.is_active ? 'نشط' : 'معطل'} color={item.is_active ? '#10b981' : '#ef4444'} />}
                  {item.provider_name && <Badge label={`المتجر: ${item.provider_name}`} color="#8b5cf6" />}
                </div>

                {/* أزرار الإجراءات */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setEditing(item); setEditJson(JSON.stringify(item, null, 2)); }} style={{ flex: 1, padding: '10px', background: 'rgba(14,165,233,0.1)', color: '#0284c7', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✏️ تعديل
                  </button>
                  <button onClick={() => handleDelete(item)} disabled={deleting === item.id} style={{ flex: 1, padding: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: deleting === item.id ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                    {deleting === item.id ? '⏳' : '🗑️ حذف'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#1e293b', width: '100%', maxWidth: 600, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#fff' }}>✏️ تعديل السجل</h2>
              <button onClick={() => setEditing(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, color: '#fff', cursor: 'pointer' }}>✕</button>
            </div>
            
            <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, lineHeight: 1.5 }}>
              قم بتعديل بيانات JSON أدناه بحذر. تأكد من الحفاظ على الأقواس والفواصل.
            </p>

            <textarea
              value={editJson}
              onChange={e => setEditJson(e.target.value)}
              style={{ flex: 1, width: '100%', minHeight: 300, padding: 12, borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 12, fontFamily: 'monospace', lineHeight: 1.5, outline: 'none', resize: 'none' }}
              spellCheck={false}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setEditing(null)} style={{ flex: 1, padding: 12, background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                إلغاء
              </button>
              <button onClick={handleSaveEdit} disabled={saving} style={{ flex: 2, padding: 12, background: saving ? '#475569' : '#10b981', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{ background: `${color}15`, color, padding: '3px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 900, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}
