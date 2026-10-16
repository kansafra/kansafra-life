// ═══════════════════════════════════════════════
// المؤذن — حساب أوقات الصلاة + الأذان
// ═══════════════════════════════════════════════

// ═══ حساب أوقات الصلاة (خوارزمية مبسطة) ═══
export function calculatePrayerTimes(lat, lng, date = new Date()) {
  const d = new Date(date);
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  
  // معادلات أساسية
  const D = (dayOfYear + 1) * 360 / 365.25;
  const decl = 23.45 * Math.sin((D - 81) * Math.PI / 180);
  const B = 360 / 365.25 * (dayOfYear - 81);
  const EoT = 9.87 * Math.sin(2 * B * Math.PI / 180) - 7.53 * Math.cos(B * Math.PI / 180) - 1.5 * Math.sin(B * Math.PI / 180);
  
  const timezone = -date.getTimezoneOffset() / 60;
  const solarNoon = 12 - (lng / 15) - (EoT / 60) + timezone;
  
  const hourAngle = (angle) => {
    const cosH = (Math.sin(angle * Math.PI / 180) - Math.sin(lat * Math.PI / 180) * Math.sin(decl * Math.PI / 180))
                / (Math.cos(lat * Math.PI / 180) * Math.cos(decl * Math.PI / 180));
    if (cosH > 1 || cosH < -1) return null;
    return Math.acos(cosH) * 180 / Math.PI;
  };
  
  const formatTime = (hours) => {
    if (hours === null) return '--:--';
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  
  const haFajr = hourAngle(-18);
  const haSunrise = hourAngle(-0.833);
  const haAsr = hourAngle(Math.atan(1 / (1 + Math.tan(Math.abs(lat - decl) * Math.PI / 180))) * 180 / Math.PI);
  const haMaghrib = hourAngle(-0.833);
  const haIsha = hourAngle(-18);
  
  const times = {
    fajr:    formatTime(solarNoon - haFajr / 15),
    sunrise: formatTime(solarNoon - haSunrise / 15),
    dhuhr:   formatTime(solarNoon + 1 / 60),
    asr:     formatTime(solarNoon + haAsr / 15),
    maghrib: formatTime(solarNoon + haMaghrib / 15),
    isha:    formatTime(solarNoon + haIsha / 15),
  };
  
  return times;
}

// ═══ تحديد الموقع ═══
export function getLocation() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('المتصفح لا يدعم تحديد الموقع'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3600000 }
    );
  });
}

// ═══ تشغيل الأذان ═══
export function playAdhan() {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio('/sounds/adhan.mp3');
    audio.volume = 1.0;
    audio.play().catch((e) => {
      // fallback to notification sound
      const a2 = new Audio('/sounds/notification.mp3');
      a2.volume = 0.8;
      a2.play().catch(() => {});
    });
  } catch {}
}

// ═══ إشعار الصلاة ═══
export async function notifyPrayer(prayerName) {
  if (typeof window === 'undefined') return;
  const labels = {
    fajr: '🌅 الفجر',
    dhuhr: '☀️ الظهر',
    asr: '🌤️ العصر',
    maghrib: '🌇 المغرب',
    isha: '🌙 العشاء',
  };
  const label = labels[prayerName] || prayerName;
  
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`حان وقت صلاة ${label}`, {
        body: 'الله أكبر — حي على الصلاة',
        icon: '/icon-192.svg',
        tag: 'prayer-' + prayerName,
        dir: 'rtl',
      });
    } catch {}
  }
}

// ═══ الأوقات القادمة ═══
export function getNextPrayer(prayerTimes) {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const order = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (const p of order) {
    if (prayerTimes[p] && prayerTimes[p] > currentTime) {
      return { name: p, time: prayerTimes[p] };
    }
  }
  return { name: 'fajr', time: prayerTimes.fajr, tomorrow: true };
}
