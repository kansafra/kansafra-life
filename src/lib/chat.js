// ═══════════ Sanad Chat ═══════════
import { supabase } from './supabase';

export function getCustomerKey() {
  if (typeof window === 'undefined') return 'server';
  let k = localStorage.getItem('sanad_customer_key');
  if (!k) {
    k = 'c_' + Math.random().toString(36).slice(2, 12);
    try { localStorage.setItem('sanad_customer_key', k); } catch {}
  }
  return k;
}

export function getCustomerName() {
  if (typeof window === 'undefined') return 'زائر';
  let n = localStorage.getItem('sanad_customer_name');
  if (!n) {
    n = prompt('ما اسمك؟ (للدردشة مع المتجر)') || 'زائر';
    try { localStorage.setItem('sanad_customer_name', n); } catch {}
  }
  return n;
}

export async function startThread(entityName, customerName) {
  if (!supabase) return null;
  const key = getCustomerKey();
  const { data: existing } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('entity_name', entityName)
    .eq('customer_key', key)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('chat_threads')
    .insert({
      entity_name: entityName,
      customer_key: key,
      customer_name: customerName || 'زائر',
    })
    .select('*')
    .single();

  if (error) { console.error(error); return null; }
  return data;
}

export async function sendMessage(threadId, sender, body, attachmentUrl) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      thread_id: threadId,
      sender,
      body,
      attachment_url: attachmentUrl || null,
    })
    .select('*')
    .single();
  if (error) { console.error(error); return null; }

  await supabase
    .from('chat_threads')
    .update({
      last_message: body.slice(0, 100),
      last_at: new Date().toISOString(),
    })
    .eq('id', threadId);

  return data;
}

export async function loadMessages(threadId) {
  if (!supabase) return [];
  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  return Array.isArray(data) ? data : [];
}

export async function loadEntityThreads(entityName) {
  if (!supabase) return [];
  const { data } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('entity_name', entityName)
    .order('last_at', { ascending: false });
  return Array.isArray(data) ? data : [];
}

export async function loadCustomerThreads() {
  if (!supabase) return [];
  const key = getCustomerKey();
  const { data } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('customer_key', key)
    .order('last_at', { ascending: false });
  return Array.isArray(data) ? data : [];
}
