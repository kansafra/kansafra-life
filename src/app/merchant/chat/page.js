'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner, isSectionAdmin, hasPermission, dataOwnerName } = useCurrentUser();
  const { success, error: toastError } = useToast();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    loadConversations();
  }, [user, userLoading]);

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv);
      // اشتراك Real-time للرسائل الجديدة
      if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
      
      subscriptionRef.current = supabase
        .channel(`messages-${activeConv}`)
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConv}` },
          (payload) => {
            setMessages((prev) => {
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          }
        )
        .subscribe();
    }
    return () => {
      if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
    };
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      let q = supabase.from('conversations').select('*').order('last_message_at', { ascending: false, nullsFirst: false });
      if (!isSectionAdmin) q = q.eq('entity_name', dataOwnerName);
      const { data } = await q;
      setConversations(data || []);
    } catch (e) { toastError('تعذّر التحميل'); }
    setLoading(false);
  }

  async function loadMessages(convId) {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true });
      setMessages(data || []);
      // تصفير عداد غير المقروء
      await supabase.from('conversations').update({ unread_count: 0 }).eq('id', convId);
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c));
    } catch (e) { toastError('تعذّر'); }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeConv) return;
    setSending(true);
    try {
      const msg = {
        conversation_id: activeConv,
        sender_type: 'merchant',
        sender_name: dataOwnerName,
        content: newMessage.trim(),
      };
      const { error } = await supabase.from('messages').insert(msg);
      if (error) throw error;
      
      await supabase.from('conversations').update({
        last_message: newMessage.trim(),
        last_message_at: new Date().toISOString(),
      }).eq('id', activeConv);
      
      setNewMessage('');
      loadConversations();
    } catch (e) { toastError('تعذّر الإرسال'); }
    setSending(false);
  }

  const filteredConvs = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.trim().toLowerCase();
    return conversations.filter(c => 
      (c.customer_name || '').toLowerCase().includes(q) || 
      (c.customer_phone || '').includes(q)
    );
  }, [conversations, search]);

  const activeConvData = conversations.find(c => c.id === activeConv);

  if (!userLoading && user && !isOwner && !isSectionAdmin && !hasPermission('customers')) {
    return <div style={{ padding: 60, textAlign: 'center' }}>🔒 ليس لديك صلاحية</div>;
  }

  if (userLoading || loading) {
    return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,.1)', zIndex: 20 }}>
        {activeConv ? (
          <>
            <button onClick={() => setActiveConv(null)} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>←</button>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 900 }}>{activeConvData?.customer_name || 'عميل'}</div>
              <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, direction: 'ltr', textAlign: 'right', marginTop: 2 }}>{activeConvData?.customer_phone}</div>
            </div>
          </>
        ) : (
          <>
            <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>💬 المحادثات</div>
              <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 2 }}>{conversations.length} محادثة</div>
            </div>
          </>
        )}
      </div>

      {!activeConv ? (
        <div style={{ flex: 1, padding: 16 }}>
          <input type="text" placeholder="🔍 ابحث عن محادثة..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 16 }} />
          
          {filteredConvs.length === 0 ? (
            <EmptyState icon="💬" title="لا توجد محادثات" description="ستظهر هنا رسائل عملائك" />
          ) : filteredConvs.map(c => (
            <button key={c.id} onClick={() => setActiveConv(c.id)} style={{ width: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, marginBottom: 10, textAlign: 'right', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#0f4d3a,#075640)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, flexShrink: 0 }}>
                {(c.customer_name || '?').charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{c.customer_name || 'عميل'}</div>
                  {c.unread_count > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '2px 8px', fontSize: 10, fontWeight: 900 }}>{c.unread_count}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last_message || '—'}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{c.last_message_at ? new Date(c.last_message_at).toLocaleString('ar-EG') : ''}</div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8, background: '#f8fafc' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>لا توجد رسائل بعد. اكتب رسالتك الأولى!</div>
            ) : messages.map(m => {
              const isMe = m.sender_type === 'merchant';
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-start' : 'flex-end' }}>
                  <div style={{
                    maxWidth: '75%', padding: '10px 14px', borderRadius: 14,
                    background: isMe ? 'linear-gradient(135deg,#0f4d3a,#075640)' : '#fff',
                    color: isMe ? '#fff' : '#0f172a',
                    border: isMe ? 'none' : '1px solid #e5e7eb',
                    fontSize: 13.5, lineHeight: 1.5,
                  }}>
                    <div>{m.content}</div>
                    <div style={{ fontSize: 9.5, opacity: 0.6, marginTop: 4, textAlign: 'left' }}>
                      {new Date(m.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ background: '#fff', padding: 12, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8 }}>
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="اكتب رسالة..."
              style={{ flex: 1, padding: 12, border: '1px solid #e5e7eb', borderRadius: 22, fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
            <button onClick={sendMessage} disabled={sending || !newMessage.trim()} style={{
              width: 48, height: 48, borderRadius: '50%',
              background: sending || !newMessage.trim() ? '#94a3b8' : 'linear-gradient(135deg,#10b981,#059669)',
              color: '#fff', border: 'none', fontSize: 18, cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}>➤</button>
          </div>
        </>
      )}
    </div>
  );
}
