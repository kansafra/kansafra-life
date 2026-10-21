// ═══════════════════════════════════════════════
// Arabic Text Normalizer
// ═══════════════════════════════════════════════
export function normalizeArabic(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\u0640/g, '')
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP_WORDS = new Set([
  'بدي', 'بدور', 'وين', 'في', 'على', 'من', 'الى', 'الي', 'انا', 'هل',
  'شو', 'ايش', 'إيش', 'كيف', 'ليش', 'متى', 'شي', 'حاجة', 'اشي', 'كل',
  'the', 'a', 'an', 'i', 'want', 'need', 'find', 'where', 'what',
]);

const SYNONYMS = {
  'دكتور': ['طبيب', 'عيادة', 'doctor', 'medical'],
  'طبيب': ['دكتور', 'عيادة', 'doctor'],
  'عيادة': ['دكتور', 'طبيب', 'doctor'],
  'مريض': ['دكتور', 'عيادة', 'medical'],
  'وجع': ['دكتور', 'صيدلية'],
  'صيدلية': ['دواء', 'أدوية', 'pharmacy'],
  'دواء': ['صيدلية', 'أدوية'],
  'مطعم': ['أكل', 'طعام', 'وجبات', 'restaurant', 'food'],
  'أكل': ['مطعم', 'طعام', 'food'],
  'اكل': ['مطعم', 'طعام', 'food'],
  'طعام': ['مطعم', 'أكل', 'food'],
  'فطور': ['مطعم', 'breakfast'],
  'غدا': ['مطعم', 'lunch'],
  'عشاء': ['مطعم', 'dinner'],
  'قهوة': ['كافيه', 'مقهى', 'coffee'],
  'كافيه': ['قهوة', 'مقهى'],
  'متجر': ['محل', 'بقالية', 'shop', 'store'],
  'محل': ['متجر', 'shop'],
  'بقالية': ['متجر', 'grocery'],
  'بقالة': ['بقالية', 'grocery'],
  'سوق': ['متجر', 'shopping'],
  'مدرسة': ['تعليم', 'معهد', 'school'],
  'تعليم': ['مدرسة', 'education'],
  'معهد': ['مدرسة'],
  'معلم': ['مدرس', 'teacher'],
  'مدرس': ['معلم', 'teacher'],
  'حرفي': ['حرفيون', 'craftsman'],
  'سباك': ['سباكة', 'حرفي', 'plumber'],
  'كهربائي': ['كهرباء', 'حرفي', 'electrician'],
  'نجار': ['نجارة', 'حرفي', 'carpenter'],
  'ورشة': ['ورشات', 'workshop'],
  'بيت': ['عقار', 'منزل', 'شقة', 'realestate', 'house'],
  'منزل': ['بيت', 'عقار', 'house'],
  'شقة': ['بيت', 'عقار', 'apartment'],
  'عقار': ['بيت', 'شقة', 'realestate'],
  'شغل': ['وظيفة', 'وظائف', 'job', 'work'],
  'وظيفة': ['شغل', 'job'],
  'تكسي': ['سيارة', 'مواصلات', 'taxi'],
  'سيارة': ['مواصلات', 'car'],
  'مواصلات': ['سيارة', 'تكسي', 'transport'],
  'توصيل': ['delivery'],
  'طوارئ': ['إسعاف', 'emergency'],
  'إسعاف': ['طوارئ', 'ambulance'],
  'دم': ['تبرع', 'blood'],
  'مسجد': ['جامع', 'mosque'],
  'جامع': ['مسجد', 'mosque'],
  'انترنت': ['إنترنت', 'نت', 'internet'],
  'نت': ['إنترنت', 'internet'],
  'مجاني': ['free'],
  'رخيص': ['cheap', 'discount'],
};

const INTENT_PATTERNS = [
  { pattern: /بدي\s*(اكل|آكل|أكل)|بدور\s*(مطعم|اكل)|جوعان|جيعان|فطور|غدا|عشاء/i, category: 'restaurant', label: 'مطاعم وطعام', icon: '🍽️' },
  { pattern: /مريض|بدي\s*دكتور|وجع|عيادة|طبيب/i, category: 'doctor', label: 'أطباء وعيادات', icon: '👨‍⚕️' },
  { pattern: /دوا|أدوية|ادوية|صيدلية/i, category: 'pharmacy', label: 'صيدليات', icon: '💊' },
  { pattern: /بدي\s*(اشتري|أشتري)|بدور\s*(متجر|محل)|تسوق/i, category: 'merchant', label: 'متاجر', icon: '🏪' },
  { pattern: /بدي\s*شغل|وظيفة|وظائف/i, category: 'jobs', label: 'وظائف', icon: '💼' },
  { pattern: /بيت|شقة|عقار|ايجار|إيجار/i, category: 'realestate', label: 'عقارات', icon: '🏠' },
  { pattern: /سباك|كهربائي|نجار|حرفي|ورشة|تصليح/i, category: 'craftsman', label: 'حرفيون', icon: '🛠️' },
  { pattern: /انترنت|نت|واي فاي|wifi/i, category: 'isp', label: 'إنترنت', icon: '📡' },
  { pattern: /طوارئ|إسعاف|حادث/i, category: 'emergency', label: 'طوارئ', icon: '🚨' },
  { pattern: /دم|تبرع|زمرة/i, category: 'blood', label: 'تبرع بالدم', icon: '🩸' },
  { pattern: /مسجد|جامع|خطبة/i, category: 'mosque', label: 'مساجد', icon: '🕌' },
  { pattern: /مدرسة|تعليم|معهد|دورة/i, category: 'school', label: 'تعليم', icon: '🎓' },
];

export function detectIntent(query) {
  if (!query) return null;
  const normalized = normalizeArabic(query);
  for (const intent of INTENT_PATTERNS) {
    if (intent.pattern.test(query) || intent.pattern.test(normalized)) return intent;
  }
  return null;
}

export function expandQuery(query) {
  const normalized = normalizeArabic(query);
  const tokens = normalized.split(' ').filter(t => t && !STOP_WORDS.has(t));
  const expanded = new Set(tokens);

  tokens.forEach(token => {
    if (SYNONYMS[token]) SYNONYMS[token].forEach(s => expanded.add(normalizeArabic(s)));
    Object.entries(SYNONYMS).forEach(([key, values]) => {
      const nk = normalizeArabic(key);
      if (token.includes(nk) || nk.includes(token)) {
        expanded.add(nk);
        values.forEach(v => expanded.add(normalizeArabic(v)));
      }
    });
  });

  return Array.from(expanded).filter(Boolean);
}

export function scoreMatch(tokens, targetText) {
  if (!targetText) return 0;
  const target = normalizeArabic(targetText);
  if (!target) return 0;
  let score = 0;
  for (const token of tokens) {
    if (!token) continue;
    if (target === token) score += 100;
    else if (target.startsWith(token)) score += 50;
    else if (target.includes(token)) score += 30;
  }
  return score;
}

export function rankResults(items, query, fields) {
  const tokens = expandQuery(query);
  if (tokens.length === 0) return items;
  return items
    .map(item => {
      let score = 0;
      fields.forEach(field => { if (item[field]) score += scoreMatch(tokens, item[field]); });
      return { ...item, _score: score };
    })
    .filter(item => item._score > 0)
    .sort((a, b) => b._score - a._score);
}

export function getTimeBasedSuggestions() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return { emoji: '🌅', greeting: 'صباح الخير!', prompt: 'بدك فطور أو قهوة؟', chips: [
      { label: '☕ كافيهات', query: 'قهوة' },
      { label: '🥐 فطور', query: 'فطور' },
      { label: '💊 صيدليات', query: 'صيدلية' },
      { label: '🥖 بقالية', query: 'بقالية' },
    ]};
  }
  if (hour >= 11 && hour < 15) {
    return { emoji: '☀️', greeting: 'نهارك سعيد', prompt: 'بدك غدا؟', chips: [
      { label: '🍽️ مطاعم', query: 'مطعم' },
      { label: '🛒 تسوق', query: 'متجر' },
      { label: '👨‍⚕️ أطباء', query: 'دكتور' },
      { label: '🔧 حرفي', query: 'حرفي' },
    ]};
  }
  if (hour >= 15 && hour < 20) {
    return { emoji: '🌆', greeting: 'مساء الخير', prompt: 'شو بدك تشتري؟', chips: [
      { label: '🛍️ متاجر', query: 'متجر' },
      { label: '🍽️ مطاعم', query: 'مطعم' },
      { label: '🏠 عقارات', query: 'بيت' },
      { label: '💼 وظائف', query: 'وظيفة' },
    ]};
  }
  return { emoji: '🌙', greeting: 'مساء الخير', prompt: 'شو بدك اليوم؟', chips: [
    { label: '🍽️ عشاء', query: 'عشاء' },
    { label: '🚚 توصيل', query: 'توصيل' },
    { label: '🚨 طوارئ', query: 'طوارئ' },
    { label: '📰 أخبار', query: 'أخبار' },
  ]};
}
