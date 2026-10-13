// ═══════════ Sanad Push Notifications ═══════════

export async function requestNotificationPermission() {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

export async function showLocalNotification(title, options = {}) {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      reg.showNotification(title, {
        body: options.body || '',
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        tag: options.tag || 'sanad',
        vibrate: [200, 100, 200],
        ...options,
      });
      return true;
    }
  }

  new Notification(title, {
    body: options.body || '',
    icon: '/icon-192.svg',
  });
  return true;
}
