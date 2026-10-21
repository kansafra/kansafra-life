'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const ADHAN_URL = '/sounds/adhan.mp3'; // تأكد من وضع الملف في public/sounds/adhan.mp3

export default function NotifEnhancer() {
  const [permission, setPermission] = useState('default');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [user, setUser] = useState(null);
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    setPermission(Notification.permission);
    audioRef.current = new Audio(ADHAN_URL);
    audioRef.current.preload = 'auto';

    let currentUser = null;
    try {
      const cust = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      const ent = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
      if (cust?.id) currentUser = { type: 'customer', id: cust.id, name: cust.name };
      else if (ent?.id) currentUser = { type: 'entity', id: ent.id, name: ent.display_name };
    } catch {}

    if (!currentUser) return;
    setUser(currentUser);

    if (Notification.permission === 'default') {
      const timer = setTimeout(() => setShowPrompt(true), 30000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!user || !supabase) return;

    const channel = supabase
      .channel('notif-enhancer-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.new.user_type !== user.type) return;
        handleIncoming(payload.new);
      })
      .subscribe();

    updateUnreadCount();
    return () => supabase.removeChannel(channel);
  }, [user]);

  async function updateUnreadCount() {
    if (!user || !supabase) return;
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('user_type', user.type)
      .eq('is_read', false);
    const n = count || 0;
    setUnreadCount(n);
    document.title = n > 0 ? `(${n}) سند` : 'سند | منصة مجتمعك';
  }

  function handleIncoming(notif) {
    // 1. تشغيل صوت الأذان (إذا كانت الصفحة مرئية)
    if (document.visibilityState === 'visible') {
      playAdhan();
    }

    // 2. اهتزاز
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);

    // 3. إشعار المتصفح (إذا كانت الصفحة في الخلفية)
    if (Notification.permission === 'granted' && document.visibilityState !== 'visible') {
      const n = new Notification(notif.title || 'إشعار جديد', {
        body: notif.body || '',
        icon: '/icons/icon.svg',
        badge: '/icons/icon.svg',
        tag: 'sanad-' + notif.id,
        requireInteraction: true,
        silent: false,
      });
      n.onclick = () => {
        window.focus();
        if (notif.link) window.location.href = notif.link;
        n.close();
      };
      setTimeout(() => n.close(), 8000);
    }

    updateUnreadCount();
  }

  async function playAdhan() {
    if (isPlayingRef.current || !audioRef.current) return;
    try {
      isPlayingRef.current = true;
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      audioRef.current.onended = () => { isPlayingRef.current = false; };
    } catch (e) {
      console.warn('[adhan] فشل التشغيل:', e.message);
      isPlayingRef.current = false;
    }
  }

  function stopAdhan() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      isPlayingRef.current = false;
    }
  }

  async function requestPermission() {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setShowPrompt(false);
      if (result === 'granted') {
        playAdhan();
        new Notification('🎉 تم تفعيل الإشعارات', {
          body: 'ستصلك تنبيهات الطلبات والتحديثات فوراً',
          icon: '/icons/icon.svg',
        });
      }
    } catch (e) {
      console.warn('[notif permission]', e.message);
    }
  }

  function dismissPrompt() {
    setShowPrompt(false);
    sessionStorage.setItem('notif_prompt_dismissed', 'true');
  }

  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;
  if (Notification.permission === 'granted') return null;
  if (!showPrompt) return null;
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('notif_prompt_dismissed') === 'true') return null;

  return (
    <div style={{
      position: 'fixed', bottom: 90, left: 16, right: 16, zIndex: 9998,
      background: '#fff', borderRadius: 16, padding: 16,
      border: '2px solid #f59e0b',
      boxShadow: '0 10px 30px rgba(245,158,11,0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🔔</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>لا تفوّت طلباتك</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>فعّل الإشعارات لتصلك الطلبات فوراً</div>
        </div>
        <button onClick={dismissPrompt} style={{ background: '#f1f5f9', border: 'none', width: 28, height: 28, borderRadius: '50%', fontSize: 14, cursor: 'pointer' }}>✕</button>
      </div>
      <button onClick={requestPermission} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
        🔔 تفعيل الإشعارات
      </button>
    </div>
  );
}
