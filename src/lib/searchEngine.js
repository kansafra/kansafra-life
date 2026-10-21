// ═══════════════════════════════════════════════════════════
// Sanad Smart Search Engine
// Algorithm: Arabic normalization + Synonym expansion + Typo tolerance + Intent
// ═══════════════════════════════════════════════════════════

// ١. تطبيع النص العربي (يكشف الإملاءات المختلفة)
export function normalizeArabic(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, '') // إزالة التشكيل
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ') // إزالة الرموز
    .replace(/\s+/g, ' ')
    .trim();
}

// ٢. قاموس المرادفات (سينونيم)
const SYNONYMS = {
  'سيارة': ['عربية', 'مركبة', 'سيارات', 'موتور', 'اوتوموبيل'],
  'عربية': ['سيارة', 'مركبة', 'سيارات'],
  'بيت': ['منزل', 'شقة', 'سكن', 'عقار', 'دار'],
  'منزل': ['بيت', 'شقة', 'سكن', 'عقار'],
  'شقة': ['بيت', 'منزل', 'سكن', 'عقار'],
  'ارض': ['أرض', 'قطعة', 'مزرعة'],
  'مزرعه': ['ارض', 'مزرعة', 'ارض زراعية'],
  'دواء': ['صيدلية', 'أدوية', 'دوا', 'علاج'],
  'صيدليه': ['دواء', 'أدوية', 'صيدلية'],
  'مطعم': ['مطاعم', 'أكل', 'طعام', 'اكل', 'وجبات', 'فطور', 'غداء', 'عشاء'],
  'طعام': ['مطعم', 'أكل', 'اكل', 'وجبات'],
  'اكل': ['مطعم', 'طعام', 'وجبات'],
  'دكتور': ['طبيب', 'أطباء', 'طبيبة', 'دكاترة', 'عيادة'],
  'طبيب': ['دكتور', 'أطباء', 'عيادة', 'طبيبة'],
  'عياده': ['طبيب', 'دكتور', 'عيادة', 'مركز طبي'],
  'مدرسه': ['تعليم', 'مدارس', 'مدرسة', 'دراسة', 'طالب'],
  'تعليم': ['مدرسة', 'مدارس', 'دروس', 'دراسة', 'طالب'],
  'دروس': ['تعليم', 'مدرسة', 'دروس خصوصية', 'دورات'],
  'وظيفه': ['عمل', 'وظائف', 'توظيف', 'شغل', 'شواغر'],
  'عمل': ['وظيفة', 'وظائف', 'شغل'],
  'شغل': ['وظيفة', 'عمل', 'وظائف'],
  'كتاب': ['كتب', 'مكتبة', 'قراءة', 'روايات'],
  'مكتبه': ['كتاب', 'كتب', 'مكتبة'],
  'ملابس': ['ازياء', 'أزياء', 'لبس', 'ثياب', 'موضه'],
  'ازياء': ['ملابس', 'أزياء', 'موضة', 'لبس'],
  'توصيل': ['دليفري', 'ديليفري', 'شحن', 'نقل'],
  'دليفري': ['توصيل', 'ديليفري', 'شحن'],
  'مناسبه': ['حفلة', 'عرس', 'زفاف', 'مناسبة', 'احتفال'],
  'عرس': ['زفاف', 'حفلة', 'مناسبة'],
  'جوال': ['موبايل', 'هاتف', 'تلفون', 'موبايلات'],
  'موبايل': ['جوال', 'هاتف', 'تلفون'],
  'كمبيوتر': ['لابتوب', 'حاسوب', 'لاب توب'],
  'لابتوب': ['كمبيوتر', 'حاسوب', 'لاب توب'],
  'صيانه': ['إصلاح', 'اصلاح', 'صيانة', 'تصليح'],
  'اصلاح': ['صيانة', 'تصليح', 'إصلاح'],
  'تصليح': ['صيانة', 'إصلاح', 'اصلاح'],
  'حلاق': ['حلاقة', 'باربر', 'حلاقين'],
  'مغسلة': ['غسيل', 'تنظيف', 'غسيل ملابس'],
  'حلويات': ['كيك', 'حلو', 'معجنات', 'حلويات شرقية'],
  'مخبز': ['خبز', 'فطائر', 'مخبوزات', 'افران'],
  'فكه': ['فواكه', 'خضار', 'خضروات', 'فاكهة'],
  'بقاله': ['سوبرماركت', 'بقالة', 'مواد غذائية'],
};

// ٣. مسافة Levenshtein (لتصحيح الأخطاء الإملائية)
function levenshtein(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

// ٤. توسيع الاستعلام بالمرادفات
function expandQuery(query) {
  const normalized = normalizeArabic(query);
  const words = normalized.split(' ').filter(Boolean);
  const expanded = new Set([normalized]);
  
  words.forEach(word => {
    const syns = SYNONYMS[word];
    if (syns) {
      syns.forEach(syn => {
        const synNorm = normalizeArabic(syn);
        expanded.add(synNorm);
        expanded.add(words.map(w => w === word ? synNorm : w).join(' '));
      });
    }
    // إضافة الكلمة بدون حروف الجر
    if (word.length > 3) {
      const stripped = word.replace(/^(ال|لل|بال|كال|فال)/, '');
      if (stripped.length > 2) expanded.add(stripped);
    }
  });
  
  return Array.from(expanded);
}

// ٥. حساب درجة المطابقة
function scoreMatch(text, queryTerms) {
  if (!text) return 0;
  const normalizedText = normalizeArabic(text);
  if (!normalizedText) return 0;
  
  let score = 0;
  const textWords = normalizedText.split(' ').filter(w => w.length > 1);
  
  queryTerms.forEach(term => {
    // مطابقة تامة
    if (normalizedText === term) score += 100;
    // احتواء النص للاستعلام
    else if (normalizedText.includes(term)) score += 40;
    // مطابقة كلمة كاملة
    else if (textWords.includes(term)) score += 30;
    
    // تصحيح الأخطاء الإملائية
    textWords.forEach(tw => {
      if (tw.length > 2 && term.length > 2) {
        const dist = levenshtein(tw, term);
        if (dist === 1) score += 15;
        else if (dist === 2 && tw.length > 4) score += 7;
      }
    });
    
    // بداية الكلمة
    textWords.forEach(tw => {
      if (tw.startsWith(term) && term.length >= 3) score += 10;
    });
  });
  
  return score;
}

// ٦. البحث الذكي
export function smartSearch(query, items, config = {}) {
  const {
    titleKey = 'title',
    descriptionKey = 'description',
    categoryKey = 'category',
    nameKey = null,
    extraKeys = [],
  } = config;
  
  if (!query || !query.trim() || !items || items.length === 0) return [];
  
  const expandedTerms = expandQuery(query);
  
  const scored = items.map(item => {
    let score = 0;
    const title = nameKey ? (item[titleKey] || item[nameKey]) : item[titleKey];
    score += scoreMatch(title, expandedTerms) * 4;
    if (descriptionKey) score += scoreMatch(item[descriptionKey], expandedTerms) * 1.5;
    if (categoryKey) score += scoreMatch(item[categoryKey], expandedTerms) * 2;
    if (nameKey) score += scoreMatch(item[nameKey], expandedTerms) * 3;
    extraKeys.forEach(k => { score += scoreMatch(item[k], expandedTerms); });
    return { item, score };
  });
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => ({ ...s.item, _score: s.score }));
}

// ٧. اقتراح بدائل عند عدم وجود نتائج
export function getSuggestions(query) {
  const normalized = normalizeArabic(query);
  const words = normalized.split(' ').filter(Boolean);
  const suggestions = new Set();
  
  words.forEach(word => {
    Object.keys(SYNONYMS).forEach(key => {
      const keyNorm = normalizeArabic(key);
      if (keyNorm !== word && levenshtein(keyNorm, word) <= 2 && keyNorm.length > 2) {
        suggestions.add(key);
      }
    });
  });
  
  return Array.from(suggestions).slice(0, 6);
}

// ٨. كشف النية
export function detectIntent(query) {
  const normalized = normalizeArabic(query);
  
  const intents = {
    buy: ['اشتري', 'بدي', 'شراء', 'ابيع', 'للبيع', 'ثمن', 'سعر', 'كم'],
    rent: ['ايجار', 'للإيجار', 'استأجر', 'استاجر'],
    job: ['وظيفة', 'عمل', 'شغل', 'توظيف', 'شاغر', 'مطلوب'],
    service: ['خدمة', 'صيانة', 'اصلاح', 'تصليح', 'تركيب'],
    food: ['اكل', 'طعام', 'مطعم', 'فطور', 'غداء', 'عشاء', 'وجبات'],
    health: ['دكتور', 'طبيب', 'عيادة', 'مرض', 'علاج', 'دواء'],
    education: ['مدرسة', 'دروس', 'تعليم', 'دورة', 'كورس', 'معلم'],
    ask: ['وين', 'كيف', 'شو', 'متى', 'ليش', 'هل'],
  };
  
  const detected = [];
  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some(k => normalized.includes(k))) detected.push(intent);
  }
  
  return detected.length > 0 ? detected : ['general'];
}

// ٩. حفظ البحث الأخير
export function saveRecentSearch(query) {
  if (typeof window === 'undefined' || !query.trim()) return;
  try {
    const recent = JSON.parse(localStorage.getItem('sanad_recent_searches') || '[]');
    const filtered = recent.filter(s => normalizeArabic(s) !== normalizeArabic(query));
    const updated = [query, ...filtered].slice(0, 8);
    localStorage.setItem('sanad_recent_searches', JSON.stringify(updated));
  } catch {}
}

export function getRecentSearches() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('sanad_recent_searches') || '[]');
  } catch {
    return [];
  }
}

export function clearRecentSearches() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('sanad_recent_searches');
}
