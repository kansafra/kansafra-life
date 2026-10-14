'use client';


import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { loadMessages, sendMessage } from '@/lib/chat';

export default function CustomerChat() {
  const params = useParams();
  const threadId = params?.id;
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    if (!threadId) return;
    load();
    const interval = setInterval(async () => {
      const m = await loadMessages(threadId);
      setMessages(m);
    }, 5000);
    return () => clearInterval(interval);
  }, [threadId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function load() {
    const [t, m] = await Promise.all([
      supabase.from('chat_threads').select('*').eq('id', threadId).single(),
      loadMessages(threadId),
    ]);
    setThread(t.data);
    setMessages(m);
    setLoading(false);
  }

  async function send() {
    if (!input.trim()) return;
    const body = input.trim();
    setInput('');
    await sendMessage(threadId, 'customer', body);
    const m = await loadMessages(threadId);
    setMessages(m);
  }

  if (loading) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="chat-page">
      <div className="chat-header">
        <Link href="/" className="chat-back">→</Link>
        <div className="chat-header-info">
          <div className="chat-header-name">{thread?.entity_name}</div>
          <div className="chat-header-status">متجر</div>
        </div>
      </div>

      <div className="chat-body">
        {messages.map((m) => (
          <div key={m.id} className={`chat-msg ${m.sender}`}>
            {m.body}
            <div className="chat-msg-time">
              {new Date(m.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="chat-input-wrap">
        <input className="chat-input" placeholder="اكتب رسالتك..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button className="chat-send" onClick={send} type="button">↑</button>
      </div>
    </div>
  );
}
