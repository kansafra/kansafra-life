// ═══════════════════════════════════════════════════════
// مكتبة البحث الذكي — تدعم العربية
// ═══════════════════════════════════════════════════════

// تطبيع النص العربي (توحيد الحروف)
export function normalizeArabic(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[ًٌٍَُِّْـ]/g, '') // إزالة التشكيل والتطويل
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 0x30))
    .replace(/\s+/g, ' ')
    .trim();
}

// حساب مسافة Levenshtein (لتصحيح الأخطاء)
function levenshtein(a, b) {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// حساب درجة التطابق (0-100)
export function matchScore(query, target) {
  if (!query || !target) return 0;
  const q = normalizeArabic(query);
  const t = normalizeArabic(target);
  if (!q || !t) return 0;

  // تطابق تام
  if (t === q) return 100;
  // يحتوي على الاستعلام
  if (t.includes(q)) return 90 + (q.length / t.length) * 10;
  // يبدأ بالاستعلام
  if (t.startsWith(q)) return 95;
  // Levenshtein للتسامح مع الأخطاء
  const dist = levenshtein(q, t);
  const maxLen = Math.max(q.length, t.length);
  const similarity = (1 - dist / maxLen) * 100;
  return similarity >= 50 ? similarity : 0;
}

// البحث في مصفوفة كائنات
export function fuzzySearch(items, query, fields, threshold = 40) {
  if (!query || !query.trim()) return items;
  const q = normalizeArabic(query);
  if (!q) return items;

  return items
    .map(item => {
      let bestScore = 0;
      for (const field of fields) {
        const value = getNestedValue(item, field);
        if (value) {
          const score = matchScore(q, String(value));
          if (score > bestScore) bestScore = score;
        }
      }
      return { item, score: bestScore };
    })
    .filter(x => x.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(x => x.item);
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

// البحث الشامل عبر الجداول
export async function globalSearch(supabase, query, opts = {}) {
  const { limit = 30, category = null } = opts;
  if (!query || !query.trim() || !supabase) {
    return { products: [], services: [], entities: [], realestate: [], jobs: [], lostfound: [] };
  }

  const q = query.trim();
  const likeQuery = `%${q}%`;

  try {
    const promises = [
      // منتجات
      supabase.from('products')
        .select('id, title, description, price, currency, image_url, category, provider_name')
        .eq('is_active', true)
        .or(`title.ilike.${likeQuery},description.ilike.${likeQuery},category.ilike.${likeQuery}`)
        .limit(limit),

      // خدمات
      supabase.from('services')
        .select('id, title, description, image_url, provider_name, phone, category_id')
        .eq('status', 'published')
        .or(`title.ilike.${likeQuery},description.ilike.${likeQuery}`)
        .limit(limit),

      // متاجر
      supabase.from('entities')
        .select('id, display_name, entity_type, logo_url, bio, city, is_verified, phone, address')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .or(`display_name.ilike.${likeQuery},bio.ilike.${likeQuery},city.ilike.${likeQuery}`)
        .limit(limit),

      // عقارات
      supabase.from('real_estate')
        .select('id, title, description, price, currency, location_text, property_type, deal_type, images')
        .or(`title.ilike.${likeQuery},description.ilike.${likeQuery},location_text.ilike.${likeQuery}`)
        .limit(limit),

      // وظائف
      supabase.from('job_postings')
        .select('id, title, description, employer_name, location, salary_min, salary_max, currency, job_type')
        .or(`title.ilike.${likeQuery},description.ilike.${likeQuery},employer_name.ilike.${likeQuery}`)
        .limit(limit),

      // مفقودات
      supabase.from('lost_found')
        .select('id, title, description, item_type, location_text, image_url')
        .or(`title.ilike.${likeQuery},description.ilike.${likeQuery}`)
        .limit(limit),
    ];

    const results = await Promise.all(promises);

    // فلترة إضافية بـ fuzzy search
    return {
      products: fuzzySearch(results[0].data || [], q, ['title', 'description', 'category', 'provider_name']),
      services: fuzzySearch(results[1].data || [], q, ['title', 'description', 'provider_name']),
      entities: fuzzySearch(results[2].data || [], q, ['display_name', 'bio', 'city']),
      realestate: fuzzySearch(results[3].data || [], q, ['title', 'description', 'location_text']),
      jobs: fuzzySearch(results[4].data || [], q, ['title', 'description', 'employer_name']),
      lostfound: fuzzySearch(results[5].data || [], q, ['title', 'description']),
    };
  } catch (e) {
    console.error('Search error:', e);
    return { products: [], services: [], entities: [], realestate: [], jobs: [], lostfound: [] };
  }
}

// كلمات شائعة للاقتراحات
export const POPULAR_SEARCHES = [
  'مطعم', 'صيدلية', 'طبيب', 'محل ملابس', 'كهربائي',
  'نجار', 'شقة للإيجار', 'وظيفة', 'مفقودات', 'مزاد',
];

// الاقتراحات حسب الفئة
export const SUGGESTIONS_BY_CATEGORY = {
  food: ['مطعم', 'مأكولات', 'حلويات', 'مشاوي', 'فطور'],
  health: ['طبيب', 'صيدلية', 'مختبر', 'عيادة', 'أسنان'],
  shopping: ['ملابس', 'أحذية', 'إلكترونيات', 'أدوات منزلية'],
  jobs: ['مهندس', 'معلم', 'محاسب', 'سائق', 'بائع'],
  realestate: ['شقة', 'منزل', 'أرض', 'محل', 'مكتب'],
};
