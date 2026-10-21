'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import EnablePushButton from '@/components/EnablePushButton';

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'unread', label: 'غير مقروء' },
  { key: 'read', label: 'مقروء' },
];

export default function NotificationsPage() {
  const router = useRouter();
  const { success } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // تحديد هوية المستخدم: زبون أو تاجر
    let user = null;
    try {
      const customer = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      const entity = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
      
      if (customer?.id) {
        user = { type: 'customer', id: customer.id, name: customer.name, phone: customer.phone };
      } else if (entity?.id) {
        user = { type: 'entity', id: entity.id, name: entity.display_name, phone: entity.phone };
      }
    } catch {}

    if (!user) {
      router.replace('/login?next=/notifications');
      return;
    }

    setCurrentUser(user);
    loadNotifications(user);

    // Realtime: إشعارات جديدة
    const channel = supabase
      .channel('notifications-' + user.type + '-' + user.id)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          if (payload.new.user_type === user.type) {
            success('🔔 إشعار جديد');
            setNotifications(prev => [payload.new, ...prev]);
          }
        })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [router, success]);

  async function loadNotifications(user) {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_type', user.type)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      setNotifications(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function markAsRead(notif) {
    if (notif.is_read) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notif.id);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
  }

  async function handleClick(notif) {
    await markAsRead(notif);
    if (notif.link) router.push(notif.link);
  }

  async function markAllRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);
    if (!error) {
      success('✅ تم تعليم الكل كمقروء');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  }

  async function deleteNotif(notif) {
    const { error } = await supabase.from('notifications').delete().eq('id', notif.id);
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    }
  }

  const stats = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
  }), [notifications]);

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter(n => !n.is_read);
    if (filter === 'read') return notifications.filter(n => n.is_read);
    return notifications;
  }, [notifications, filter]);

  function timeAgo(date) {
    if (!date) return '';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
    return new Date(date).toLocaleDateString('ar-SY');
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '20px', color: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, flex: 1 }}>🔔 الإشعارات</h1>
          {stats.unread > 0 && (
            <div style={{ background: '#ef4444', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
              {stats.unread} جديد
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          مرحباً {currentUser?.name || ''}
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>
        
        {/* Filters + Mark All */}
        <div style={{ marginBottom: 16 }}>
          <EnablePushButton />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, flex: 1, overflowX: 'auto' }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{ background: filter === f.key ? '#0f4d3a' : '#fff', color: filter === f.key ? '#fff' : '#64748b', border: filter === f.key ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                {f.label} {f.key === 'unread' && stats.unread > 0 && `(${stats.unread})`}
              </button>
            ))}
          </div>
          {stats.unread > 0 && (
            <button onClick={markAllRead} style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.3)', padding: '8px 12px', borderRadius: 20, fontSize: 11, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
              ✓ الكل مقروء
            </button>
          )}
        </div>

        {/* Notifications List */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#64748b', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🔕</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>
              {notifications.length === 0 ? 'لا توجد إشعارات بعد' : filter === 'unread' ? 'كل شيء مقروء ✨' : 'لا توجد إشعارات مقروءة'}
            </div>
            <div style={{ fontSize: 12 }}>
              {notifications.length === 0 ? 'ستصلك هنا إشعارات طلباتك وأخبار المنصة' : ''}
            </div>
          </div>
        ) : (
          filtered.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleClick(notif)}
              style={{
                background: notif.is_read ? '#fff' : 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(59,130,246,0.05))',
                borderRadius: 16,
                padding: 14,
                marginBottom: 10,
                border: notif.is_read ? '1px solid #e2e8f0' : '1px solid rgba(16,185,129,0.3)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', gap: 12 }}>
                {/* Icon */}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: notif.is_read ? '#f1f5f9' : 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {notif.icon || '🔔'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: notif.is_read ? 800 : 900, color: '#0f172a', flex: 1, lineHeight: 1.4 }}>
                      {notif.title}
                    </div>
                    {!notif.is_read && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0, marginTop: 4 }} />
                    )}
                  </div>
                  {notif.body && (
                    <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {notif.body}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>
                      {timeAgo(notif.created_at)}
                    </div>
                    {notif.link && (
                      <div style={{ fontSize: 10, color: '#0ea5e9', fontWeight: 900 }}>
                        اضغط للتفاصيل ←
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); deleteNotif(notif); }}
                style={{ position: 'absolute', top: 8, left: 8, width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}
                title="حذف"
              >
                ✕
              </button>
            </div>
          ))
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
