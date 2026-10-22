async function handleLogin(e) {
  e.preventDefault();
  if (!form.username.trim() || !form.password) {
    toastError('أدخل اسم المستخدم وكلمة المرور');
    return;
  }
  setLoading(true);
  try {
    // إرسال الطلب إلى الـ API الآمن الخاص بنا
    const res = await fetch('/api/auth/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: form.username.trim().toLowerCase(), 
        password: form.password 
      })
    });
    
    const data = await res.json();

    if (!res.ok) {
      toastError(data.error || 'بيانات الدخول غير صحيحة');
      return;
    }

    const admin = data.admin;
    localStorage.setItem('sanad_admin', JSON.stringify(admin));
    document.cookie = `sanad_admin=${encodeURIComponent(JSON.stringify(admin))}; path=/; max-age=86400`;
    
    success('مرحباً ' + admin.display_name);
    setTimeout(() => router.push(next), 300);
    
  } catch (err) {
    console.error(err);
    toastError('خطأ في الاتصال بالسيرفر');
  } finally { 
    setLoading(false); 
  }
}
