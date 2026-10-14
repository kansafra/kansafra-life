'use client';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useT } from '@/lib/useT';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useT();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    if (!supabase) {
      setError('قاعدة البيانات غير متصلة');
      return;
    }

    setLoading(true);
    try {
      const { data, error: fnErr } = await supabase.rpc('verify_login', {
        un: username.trim(),
        pw: password,
      });

      if (fnErr) {
        console.error('Login error:', fnErr);
        setError('حدث خطأ في الخادم');
        setLoading(false);
        return;
      }
      if (!data || data.length === 0) {
        setError('بيانات الدخول غير صحيحة');
        setLoading(false);
        return;
      }

      const entity = data[0];
      try {
        localStorage.setItem('sanad_entity', JSON.stringify(entity));
      } catch {}

      router.push('/merchant');
    } catch (err) {
      console.error(err);
      setError('حدث خطأ غير متوقع');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Link href="/" className="login-back">
        → الرئيسية
      </Link>

      <div className="login-hero">
        <div className="login-logo"><span>س</span></div>
        <h1 className="login-title">{t("auth.login")}</h1>
        <p className="login-subtitle">
          سجّل دخولك لإدارة نشاطك التجاري على سند
        </p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-field">
          <label className="login-label">{t("auth.username")}</label>
          <input
            className="login-input"
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
          />
        </div>

        <div className="login-field">
          <label className="login-label">{t("auth.password")}</label>
          <input
            className="login-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button className="login-submit" type="submit" disabled={loading}>
          {loading ? '... جارٍ التحقق' : '→ تسجيل الدخول'}
        </button>

        
      </form>
    </div>
  );
}
