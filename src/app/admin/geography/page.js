'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const DEFAULT_TREE = [
  { id: 'sy', name: 'سوريا', level: 1, icon: '🇸🇾', parent: null, count: 14 },
  { id: 'idlib', name: 'محافظة إدلب', level: 2, icon: '🏛️', parent: 'sy', count: 8 },
  { id: 'harim', name: 'منطقة حارم', level: 3, icon: '📍', parent: 'idlib', count: 12 },
  { id: 'kansafra', name: 'بلدة كنصفرة', level: 4, icon: '🏘️', parent: 'harim', count: 5 },
  { id: 'center', name: 'حي المركز', level: 5, icon: '🏠', parent: 'kansafra', count: 0 },
  { id: 'north', name: 'حي الشمال', level: 5, icon: '🏠', parent: 'kansafra', count: 0 },
  { id: 'south', name: 'حي الجنوب', level: 5, icon: '🏠', parent: 'kansafra', count: 0 },
];

export default function GeoAdmin() {
  const router = useRouter();
  const [nodes, setNodes] = useState(DEFAULT_TREE);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
  }, [router]);

  function openAdd(parent) {
    setEditing({ _new: true, parent });
    setForm({ name: '', icon: '📍', level: (parent ? parent.level + 1 : 1), parent: parent?.id });
  }

  function openEdit(node) {
    setEditing(node);
    setForm({ name: node.name, icon: node.icon, level: node.level, parent: node.parent });
  }

  function save() {
    if (!form.name?.trim()) { alert('الاسم مطلوب'); return; }
    if (editing._new) {
      const newNode = {
        id: 'node_' + Date.now(),
        name: form.name,
        icon: form.icon || '📍',
        level: Number(form.level) || 1,
        parent: form.parent || null,
        count: 0,
      };
      setNodes([...nodes, newNode]);
    } else {
      setNodes(nodes.map((n) => n.id === editing.id ? { ...n, name: form.name, icon: form.icon, level: Number(form.level), parent: form.parent } : n));
    }
    setEditing(null);
  }

  function del(node) {
    if (!confirm(`حذف "${node.name}"؟`)) return;
    setNodes(nodes.filter((n) => n.id !== node.id && n.parent !== node.id));
  }

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">🌳 الشجرة الجغرافية</span>
        <button className="mng-add-btn" onClick={() => openAdd(null)} type="button">+ إضافة</button>
      </div>

      <div className="geo-tree">
        {nodes.map((n) => (
          <div key={n.id} className={`geo-node level-${Math.min(n.level, 4)}`}>
            <span className="geo-node-icon">{n.icon}</span>
            <span className="geo-node-name">{n.name}</span>
            <span className="geo-node-count">مستوى {n.level}</span>
            <button onClick={() => openAdd(n)} type="button" style={{ background: 'rgba(14,138,102,.1)', color: 'var(--f-700)', border: 'none', padding: 6, borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>+</button>
            <button onClick={() => openEdit(n)} type="button" style={{ background: 'var(--c-100)', color: 'var(--n-700)', border: 'none', padding: 6, borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>✏️</button>
            <button onClick={() => del(n)} type="button" style={{ background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', padding: 6, borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>✕</button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="mng-modal-bg" onClick={() => setEditing(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{editing._new ? 'إضافة موقع' : 'تعديل موقع'}</h3>
            <div className="new-service-field">
              <label className="new-service-label">الاسم</label>
              <input className="new-service-input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="new-service-field">
              <label className="new-service-label">الأيقونة</label>
              <input className="new-service-input" value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </div>
            <div className="new-service-field">
              <label className="new-service-label">المستوى (1=دولة، 5=حي)</label>
              <input className="new-service-input" type="number" min="1" max="5" value={form.level || 1} onChange={(e) => setForm({ ...form, level: e.target.value })} />
            </div>
            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setEditing(null)} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={save} type="button">✓ حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
