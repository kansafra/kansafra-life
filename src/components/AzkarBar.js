'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const DEFAULT_AZKAR = [
  { id: 1, text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', source: 'رواه مسلم' },
  { id: 2, text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', source: 'رواه البخاري' },
  { id: 3, text: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ', source: 'الصلاة على النبي' },
  { id: 4, text: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ', source: 'رواه البخاري' },
  { id: 5, text: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', source: 'رواه البخاري' },
  { id: 6, text: 'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ', source: 'رواه مسلم' },
  { id: 7, text: 'حَسْبِيَ اللَّهُ وَنِعْمَ الْوَكِيلُ', source: 'ذكر' },
  { id: 8, text: 'اللَّهُمَّ أَجِرْنِي مِنَ النَّارِ', source: 'رواه أبو داود' },
];

export default function AzkarBar() {
  const [azkar, setAzkar] = useState(DEFAULT_AZKAR);
  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(false);
  const [settings, setSettings] = useState({
    enabled: true,
    interval: 15,
    duration: 12,
    sound: true,
  });
  const audioRef = useRef(null);
  const idxRef = useRef(0);

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      try {
        const [azkarRes, settingsRes] = await Promise.all([
          supabase.from('azkar').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('app_settings').select('*').in('key', [
            'azkar_enabled', 'azkar_interval_minutes',
            'azkar_display_seconds', 'azkar_sound_enabled'
          ]),
        ]);
        if (azkarRes.data?.length) setAzkar(azkarRes.data);
        if (settingsRes.data) {
          const s = {};
          settingsRes.data.forEach((x) => { s[x.key] = x.value; });
          setSettings({
            enabled: s.azkar_enabled !== 'false',
            interval: parseInt(s.azkar_interval_minutes) || 15,
            duration: parseInt(s.azkar_display_seconds) || 12,
            sound: s.azkar_sound_enabled !== 'false',
          });
        }
      } catch (e) { console.warn('Azkar load:', e); }
    }
    load();
  }, []);

  useEffect(() => {
    if (!settings.enabled || azkar.length === 0) return;

    const show = () => {
      const next = azkar[idxRef.current % azkar.length];
      idxRef.current += 1;
      setCurrent(next);
      setVisible(true);
      if (settings.sound && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      setTimeout(() => setVisible(false), settings.duration * 1000);
    };

    const first = setTimeout(show, 3000);
    const interval = setInterval(show, settings.interval * 60 * 1000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, [settings, azkar]);

  if (!visible || !current) return null;

  return (
    <>
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />
      <div className="azkar-bar" onClick={() => setVisible(false)}>
        <div className="azkar-inner">
          <span className="azkar-icon">📿</span>
          <div className="azkar-body">
            <div className="azkar-text">{current.text}</div>
            {current.source && <div className="azkar-source">{current.source}</div>}
          </div>
          <button className="azkar-close" type="button" onClick={(e) => { e.stopPropagation(); setVisible(false); }}>×</button>
        </div>
      </div>
    </>
  );
}
