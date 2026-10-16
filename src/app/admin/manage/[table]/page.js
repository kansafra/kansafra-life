'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getTableConfig } from '@/lib/adminTables';

const FIELD_LABELS = {
  username:'اسم المستخدم', display_name:'الاسم', entity_type:'النوع', phone:'الهاتف',
  email:'البريد', bio:'نبذة', logo_url:'الرابط', is_active:'نشط', title:'العنوان',
  description:'الوصف', provider_name:'مقدم الخدمة', address:'العنوان', image_url:'الصورة',
  is_featured:'مميز', status:'الحالة', price:'السعر', discount_percent:'الخصم %',
  stock:'المخزون', currency:'العملة', unit:'الوحدة', category:'الفئة',
  customer_name:'اسم العميل', customer_phone:'هاتف العميل', total:'المجموع',
  order_code:'رقم الطلب', ref_code:'رقم البلاغ', full_name:'الاسم',
  name:'الاسم', slug:'المعرف', icon:'الأيقونة', sort_order:'الترتيب',
  body:'النص', is_published:'منشور', reviewer_name:'المقيّم', rating:'التقييم',
  comment:'التعليق', is_approved:'موافق عليه', code:'الكود',
  discount_type:'نوع الخصم', discount_value:'قيمة الخصم', min_order:'الحد الأدنى',
  max_uses:'أقصى استخدامات', owner_name:'اسم المالك', vehicle_type:'نوع المركبة',
  brand:'الماركة', model:'الموديل', plate_number:'رقم اللوحة', route:'الخط',
  is_available:'متاح', patient_name:'اسم المريض', patient_phone:'هاتف المريض',
  appointment_date:'التاريخ', appointment_time:'الوقت', notes:'ملاحظات',
  blood_type:'الفصيلة', city:'المدينة', hospital:'المستشفى',
  urgency:'الأهمية', units_needed:'الوحدات', requester_name:'اسم الطالب',
  grade:'الصف', section:'الشعبة', teacher_name:'المعلم', capacity:'السعة',
  entity_name:'الجهة', school_name:'المدرسة', parent_name:'ولي الأمر',
  parent_phone:'هاتف ولي الأمر', birth_year:'سنة الميلاد', mosque_name:'الجامع',
  lesson_type:'النوع', content:'المحتوى', scheduled_at:'موعد الدرس',
  level:'المستوى', schedule:'الجدول', students_count:'عدد الطلاب',
  donor_name:'المتبرع', recipient_name:'المستفيد', amount:'المبلغ',
  purpose:'الغرض', club_name:'النادي', position:'المركز', jersey_number:'رقم القميص',
  goals:'الأهداف', assists:'صناعة', matches:'المباريات', opponent:'المنافس',
  location:'الموقع', competition:'البطولة', our_score:'أهدافنا', their_score:'أهدافهم',
  team_name:'الفريق', played:'لعب', won:'فاز', drawn:'تعادل', lost:'خسر',
  goals_for:'له', goals_against:'عليه', points:'نقاط', author_name:'الكاتب',
  decade:'العقد', place_name:'المكان', era:'الحقبة', media_url:'الرابط',
  author:'المؤلف', year:'السنة', cover_url:'الغلاف', file_url:'الملف',
  place_type:'النوع', location_text:'الموقع', entry_price:'سعر الدخول',
  opening_hours:'ساعات العمل', employer_name:'صاحب العمل', job_type:'نوع الوظيفة',
  salary_min:'الراتب الأدنى', salary_max:'الراتب الأعلى', requirements:'المتطلبات',
  property_type:'نوع العقار', deal_type:'نوع المعاملة', rooms:'الغرف',
  area_m2:'المساحة', item_type:'النوع', reporter_name:'المُبلّغ', service_type:'نوع الخدمة',
  requester_phone:'الهاتف', expat_name:'المغترب', recipient_phone:'هاتف المستفيد',
  seller_name:'البائع', starting_price:'سعر البداية', current_price:'السعر الحالي',
  recipient_entity:'المستلم', type:'النوع', is_read:'مقروء', action:'العملية',
  actor:'المستخدم', target_type:'النوع', role:'الدور',
  description_ar:'الوصف بالعربية', sort:'الترتيب', password_hash:'كلمة المرور',
  image:'الصورة', price_per_km:'سعر الكيلو', base_price:'أجرة البداية',
  working_hours:'ساعات العمل', notes_text:'ملاحظات',
};

const fieldLabel = (k) => FIELD_LABELS[k] || k;

// الحقول التي لا يجب إضافتها (تلقائية)
const AUTO_FIELDS = ['id', 'created_at', 'updated_at'];

// اقتراح نوع الحقل
const suggestType = (key, val) => {
  if (/^(is_|has_|active|approved|published|featured|available|read)/.test(key)) return 'boolean';
  if (/url|image|logo|cover|photo|media|file/.test(key)) return 'url';
  if (/email/.test(key)) return 'email';
  if (/phone|tel/.test(key)) return 'tel';
  if (/price|amount|total|salary|value|points|goals|assists|matches|played|won|drawn|lost|score|capacity|stock|order|number|year|sort|count/.test(key)) return 'number';
  if (/description|body|content|bio|notes|requirements|purpose|comment/.test(key)) return 'textarea';
  if (key === 'category' || key === 'entity_type' || key === 'status' || key === 'currency' || key === 'unit' || key === 'job_type' || key === 'deal_type' || key === 'property_type' || key === 'place_type' || key === 'item_type' || key === 'blood_type' || key === 'urgency' || key === 'role' || key === 'type' || key === 'lesson_type' || key === 'discount_type' || key === 'vehicle_type' || key === 'service_type') return 'select';
  return 'text';
};

const SELECT_OPTIONS = {
  entity_type: ['merchant','doctor','pharmacy','school','mosque','municipality','council','charity','sports','memory','office','restaurant','transport'],
  currency: ['SYP','USD','EUR','TRY','SAR','AED'],
  status: ['active','inactive','pending','preparing','delivering','done','cancelled','received','dispatched','in_progress','resolved','open','closed'],
  unit: ['قطعة','كيلو','علبة','حزمة','لتر','غرام'],
  deal_type: ['للبيع','للإيجار'],
  property_type: ['شقة','منزل','أرض','محل تجاري','مكتب','مخزن'],
  place_type: ['معلم أثري','طبيعة','مطعم','فندق','متحف','أخرى'],
  item_type: ['مفقود','وجدته'],
  blood_type: ['A+','A-','B+','B-','AB+','AB-','O+','O-'],
  urgency: ['normal','urgent','critical'],
  role: ['owner','admin','support','billing','auditor'],
  job_type: ['دوام كامل','دوام جزئي','عن بعد','مؤقت','تدريب'],
  discount_type: ['percent','fixed'],
  vehicle_type: ['taxi','bus','service','truck','motorcycle','van','other'],
  service_type: ['مساعدة منزلية','مرافق للمستشفى','توصيل أدوية','قراءة وثائق','دعم نفسي','أخرى'],
  lesson_type: ['lesson','khutbah','circle'],
  type: ['info','warning','success','error'],
  category: ['food','drink','grocery','medicine','clothes','electronics','home','beauty','stationery','other'],
};

export default function TableManager() {
  const router = useRouter();
  const params = useParams();
  const table = params?.table;
  const cfg = getTableConfig(table);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState(null); // 'add' | 'edit'
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router, table]);

  async function load() {
    if (!supabase || !table) { setLoading(false); return; }
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(500);
    if (!error) {
      const list = Array.isArray(data) ? data : [];
      setRows(list);
      // استخراج الأعمدة من أول صف
      if (list.length > 0) {
        const cols = Object.keys(list[0]).filter((k) => !AUTO_FIELDS.includes(k));
        setColumns(cols);
      } else if (cfg) {
        // إذا فارغ، نستخدم الأعمدة المعرّفة يوجد cfg
        const allEditable = cfg.editable || [];
        setColumns(allEditable);
      }
    }
    setLoading(false);
  }

  function openAdd() {
    setMode('add');
    setEditing(null);
    const init = {};
    // استخدام الأعمدة المعرّفة يوجد cfg + القائمة
    const allCols = [...new Set([...(cfg?.editable || []), ...columns])];
    allCols.forEach((k) => { init[k] = ''; });
    setForm(init);
  }

  function openEdit(row) {
    setMode('edit');
    setEditing(row);
    const init = {};
    const allCols = [...new Set([...(cfg?.editable || []), ...columns])];
    allCols.forEach((k) => {
      let v = row[k];
      if (v === true) v = 'true';
      if (v === false) v = 'false';
      if (v === null || v === undefined) v = '';
      init[k] = String(v);
    });
    setForm(init);
  }

  async function save() {
    if (!cfg) return;
    setSaving(true);

    const allCols = [...new Set([...(cfg?.editable || []), ...columns])];
    const payload = {};

    allCols.forEach((k) => {
      const v = form[k];
      if (v === '' || v === undefined) return;
      const type = suggestType(k, v);
      if (type === 'boolean' || v === 'true' || v === 'false') {
        payload[k] = v === 'true' ? true : v === 'false' ? false : Boolean(v);
      } else if (type === 'number') {
        const n = Number(v);
        if (!isNaN(n)) payload[k] = n;
      } else {
        payload[k] = v;
      }
    });

    let error;
    if (mode === 'add') {
      const res = await supabase.from(table).insert(payload);
      error = res.error;
    } else {
      const res = await supabase.from(table).update(payload).eq('id', editing.id);
      error = res.error;
    }

    setSaving(false);
    if (error) { alert('تعذّر الحفظ: ' + error.message); return; }
    setMode(null);
    setEditing(null);
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const { error } = await supabase.from(table).delete().eq('id', deleting.id);
    if (error) { alert('تعذّر الحذف'); return; }
    setRows((arr) => arr.filter((r) => r.id !== deleting.id));
    setDeleting(null);
  }

  if (!cfg) return <div className="sect-empty"><span className="em">❌</span><p>الجدول غير معروف</p></div>;

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return Object.values(r).some((v) => String(v || '').toLowerCase().includes(q));
  });

  const renderValue = (k, v) => {
    if (v === true) return '✓';
    if (v === false) return '✗';
    if (v === null || v === undefined || v === '') return '—';
    const s = String(v);
    return s.length > 30 ? s.slice(0, 30) + '…' : s;
  };

  // الحقول التي ستُعرض يوجد النموذج
  const formColumns = [...new Set([...(cfg?.editable || []), ...columns])];

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin/manage" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">{cfg.icon} {cfg.label}</span>
        <span className="admin-sub-count">{rows.length}</span>
        <button className="admin-add-btn" onClick={openAdd} type="button">
          + إضافة
        </button>
      </div>

      <div className="admin-search">
        <input type="text" placeholder="ابحث..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty">
          <span className="em">📭</span>
          <p>لا توجد سجلات</p>
          <button className="admin-add-btn" onClick={openAdd} type="button" style={{ marginTop: 16 }}>
            + إضافة أول سجل
          </button>
        </div>
      ) : (
        <div className="admin-rows">
          {filtered.map((r) => (
            <div key={r.id} className="admin-row">
              <div className="admin-row-head">
                <div className="admin-row-title">{r[cfg.titleField] || r.title || r.name || r.display_name || '(بدون عنوان)'}</div>
                <div className="admin-row-id">#{r.id?.slice(0, 6) || '—'}</div>
              </div>
              <div className="admin-row-fields">
                {(cfg.columns || []).slice(0, 4).map((k) => (
                  <div key={k} className="admin-row-field">
                    <strong>{fieldLabel(k)}:</strong> {renderValue(k, r[k])}
                  </div>
                ))}
              </div>
              <div className="admin-row-actions">
                <button className="admin-btn edit" onClick={() => openEdit(r)} type="button">
                  ✏️ تعديل
                </button>
                <button className="admin-btn del" onClick={() => setDeleting(r)} type="button">
                  🗑️ حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode && (
        <div className="admin-modal-bg" onClick={() => { setMode(null); setEditing(null); }}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-handle" />
            <h3 className="admin-modal-title">
              {mode === 'add' ? `➕ إضافة إلى ${cfg.label}` : `✏️ تعديل: ${editing?.[cfg.titleField] || ''}`}
            </h3>

            {formColumns.map((k) => {
              const val = form[k] ?? '';
              const type = suggestType(k, val);
              return (
                <div key={k} className="admin-form-row">
                  <label className="admin-form-label">{fieldLabel(k)}</label>
                  {type === 'boolean' ? (
                    <select
                      className="admin-form-select"
                      value={val}
                      onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    >
                      <option value="">— اختر —</option>
                      <option value="true">✓ نعم</option>
                      <option value="false">✗ لا</option>
                    </select>
                  ) : SELECT_OPTIONS[k] ? (
                    <select
                      className="admin-form-select"
                      value={val}
                      onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    >
                      <option value="">— اختر —</option>
                      {SELECT_OPTIONS[k].map((o) => (
                        <option key={o} value={o}>{fieldLabel(o) === o ? o : fieldLabel(o)}</option>
                      ))}
                    </select>
                  ) : type === 'textarea' ? (
                    <textarea
                      className="admin-form-textarea"
                      value={val}
                      onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                      placeholder={fieldLabel(k)}
                    />
                  ) : (
                    <input
                      className="admin-form-input"
                      type={type === 'number' ? 'number' : type === 'url' ? 'url' : type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'text'}
                      value={val}
                      onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                      placeholder={fieldLabel(k)}
                    />
                  )}
                </div>
              );
            })}

            <div className="admin-form-actions">
              <button className="admin-btn ghost" onClick={() => { setMode(null); setEditing(null); }} type="button">
                إلغاء
              </button>
              <button className="admin-btn gold" onClick={save} disabled={saving} type="button">
                {saving ? '... جارٍ' : mode === 'add' ? '✓ إضافة' : '✓ حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="admin-modal-bg" onClick={() => setDeleting(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-handle" />
            <div className="admin-confirm-icon">🗑️</div>
            <h3 className="admin-modal-title" style={{ textAlign: 'center' }}>تأكيد الحذف</h3>
            <div className="admin-confirm-text">
              سيتم حذف <strong>{deleting[cfg.titleField] || 'هذا السجل'}</strong> نهائياً.
            </div>
            <div className="admin-form-actions">
              <button className="admin-btn ghost" onClick={() => setDeleting(null)} type="button">إلغاء</button>
              <button className="admin-btn del" onClick={confirmDelete} type="button">✓ حذف نهائي</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
