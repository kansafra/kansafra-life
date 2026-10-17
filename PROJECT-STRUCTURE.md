# 📁 مشروع سند — التوثيق الكامل

**تاريخ التوثيق**: ١٧‏/١٠‏/٢٠٢٦، ٣:٣٢:٥٩ ص

## 🌳 شجرة المشروع

```
sanad/
├── package.json
├── next.config.mjs
├── postcss.config.mjs
├── .env.local
├── public/
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
└── node_modules/
```

## 📂 مجلد `src/app/` — الصفحات

- 📁 `admin/`
- 📁 `admin/accounts/`
- 📁 `admin/analytics/`
- 📁 `admin/announcements/`
- 📁 `admin/audit/`
- 📁 `admin/azkar/`
- 📁 `admin/backup/`
- 📁 `admin/categories/`
- 📁 `admin/charts/`
- 📁 `admin/communities/`
- 📁 `admin/currency/`
- 📁 `admin/emergency-contacts/`
- 📁 `admin/entities/`
- 📁 `admin/geography/`
- 📁 `admin/login/`
- 📁 `admin/maintenance/`
- 📁 `admin/manage/`
- 📁 `admin/manage/[table]/`
- 📁 `admin/moderation/`
- 📁 `admin/penalties/`
- 📁 `admin/plans/`
- 📁 `admin/reports/`
- 📁 `admin/reviews/`
- 📁 `admin/settings/`
- 📁 `admin/sos/`
- 📁 `admin/subscriptions/`
- 📁 `admin/support/`
- 📁 `admin/users/`
- 📁 `ai/`
- 📁 `auctions/`
- 📁 `blood/`
- 📁 `cart/`
- 📁 `chat/`
- 📁 `chat/[id]/`
- 📁 `checkout/`
- 📁 `club/`
- 📁 `club/[name]/`
- 📁 `customer/`
- 📁 `delivery/`
- 📁 `doctor/`
- 📁 `doctor/[name]/`
- 📁 `doctor/[name]/book/`
- 📁 `elderly/`
- 📁 `entity/`
- 📁 `entity/[name]/`
- 📁 `environment/`
- 📁 `exchange/`
- 📁 `expat/`
- 📁 `favorites/`
- 📁 `invoice/`
- 📁 `invoice/[id]/`
- 📁 `jobs/`
- 📁 `legal/`
- 📁 `legal/api-terms/`
- 📁 `legal/content-policy/`
- 📁 `legal/cookies/`
- 📁 `legal/dpa/`
- 📁 `legal/gdpr/`
- 📁 `legal/guidelines/`
- 📁 `legal/partner/`
- 📁 `legal/privacy/`
- 📁 `legal/refund/`
- 📁 `legal/sla/`
- 📁 `legal/terms/`
- 📁 `library/`
- 📁 `login/`
- 📁 `logout/`
- 📁 `lostfound/`
- 📁 `loyalty/`
- 📁 `memory/`
- 📁 `merchant/`
- 📁 `merchant/announcements/`
- 📁 `merchant/appointments/`
- 📁 `merchant/attendance/`
- 📁 `merchant/auctions/`
- 📁 `merchant/auctions/new/`
- 📁 `merchant/bookings/`
- 📁 `merchant/budget/`
- 📁 `merchant/chat/`
- 📁 `merchant/circles/`
- 📁 `merchant/class_files/`
- 📁 `merchant/classes/`
- 📁 `merchant/classes/[id]/`
- 📁 `merchant/classes/[id]/files/`
- 📁 `merchant/classes/[id]/files/new/`
- 📁 `merchant/classes/new/`
- 📁 `merchant/coupons/`
- 📁 `merchant/customers/`
- 📁 `merchant/debts/`
- 📁 `merchant/delivery/`
- 📁 `merchant/doctor_schedules/`
- 📁 `merchant/documents/`
- 📁 `merchant/donations/`
- 📁 `merchant/elderly/`
- 📁 `merchant/elderly/new/`
- 📁 `merchant/elderly_requests/`
- 📁 `merchant/employees/`
- 📁 `merchant/events/`
- 📁 `merchant/exchange-rates/`
- 📁 `merchant/expat/`
- 📁 `merchant/expat/new/`
- 📁 `merchant/fees/`
- 📁 `merchant/grades/`
- 📁 `merchant/hobbies/`
- 📁 `merchant/import/`
- 📁 `merchant/internet/`
- 📁 `merchant/internet/invoices/`
- 📁 `merchant/internet/plans/`
- 📁 `merchant/internet/subscribers/`
- 📁 `merchant/internet/tickets/`
- 📁 `merchant/inventory/`
- 📁 `merchant/invoices/`
- 📁 `merchant/job_postings/`
- 📁 `merchant/job_seekers/`
- 📁 `merchant/jobs/`
- 📁 `merchant/jobs/new/`
- 📁 `merchant/lessons/`
- 📁 `merchant/library/`
- 📁 `merchant/library/new/`
- 📁 `merchant/lostfound/`
- 📁 `merchant/lostfound/new/`
- 📁 `merchant/matches/`
- 📁 `merchant/matches/new/`
- 📁 `merchant/medical_records/`
- 📁 `merchant/memory/`
- 📁 `merchant/memory/new/`
- 📁 `merchant/memory_items/`
- 📁 `merchant/memory_places/`
- 📁 `merchant/memory_stories/`
- 📁 `merchant/moderation/`
- 📁 `merchant/municipal/`
- 📁 `merchant/office_requests/`
- 📁 `merchant/oncall_shifts/`
- 📁 `merchant/orders/`
- 📁 `merchant/payment_methods/`
- 📁 `merchant/payments/`
- 📁 `merchant/players/`
- 📁 `merchant/players/new/`
- 📁 `merchant/prescriptions/`
- 📁 `merchant/products/`
- 📁 `merchant/products/[id]/`
- 📁 `merchant/products/[id]/edit/`
- 📁 `merchant/products/new/`
- 📁 `merchant/realestate/`
- 📁 `merchant/realestate/new/`
- 📁 `merchant/referrals/`
- 📁 `merchant/reminder-settings/`
- 📁 `merchant/reports/`
- 📁 `merchant/reviews/`
- 📁 `merchant/school/`
- 📁 `merchant/security/`
- 📁 `merchant/sermons/`
- 📁 `merchant/services/`
- 📁 `merchant/services/new/`
- 📁 `merchant/settings/`
- 📁 `merchant/sports-news/`
- 📁 `merchant/sports_matches/`
- 📁 `merchant/sports_players/`
- 📁 `merchant/sports_standings/`
- 📁 `merchant/students/`
- 📁 `merchant/subjects/`
- 📁 `merchant/subscription/`
- 📁 `merchant/support/`
- 📁 `merchant/teachers/`
- 📁 `merchant/teachers/new/`
- 📁 `merchant/tourism/`
- 📁 `merchant/tourism/new/`
- 📁 `merchant/training/`
- 📁 `merchant/utilities/`
- 📁 `merchant/vehicles/`
- 📁 `merchant/vehicles/new/`
- 📁 `merchant/venues/`
- 📁 `merchant/volunteers/`
- 📁 `mosque/`
- 📁 `mosque/[name]/`
- 📁 `my-appointments/`
- 📁 `news/`
- 📁 `news/[id]/`
- 📁 `notifications/`
- 📁 `offline/`
- 📁 `oncall/`
- 📁 `order/`
- 📁 `order/[id]/`
- 📁 `plans/`
- 📁 `product/`
- 📁 `product/[id]/`
- 📁 `realestate/`
- 📁 `register/`
- 📁 `school/`
- 📁 `school/[name]/`
- 📁 `school/[name]/class/`
- 📁 `school/[name]/class/[id]/`
- 📁 `search/`
- 📁 `service/`
- 📁 `service/[id]/`
- 📁 `sos/`
- 📁 `store/`
- 📁 `store/[provider]/`
- 📁 `stores/`
- 📁 `tourism/`

- 📄 `admin/accounts/page.js` (15.4 KB)
- 📄 `admin/analytics/page.js` (4.6 KB)
- 📄 `admin/announcements/page.js` (0.3 KB)
- 📄 `admin/audit/page.js` (2.5 KB)
- 📄 `admin/azkar/page.js` (11.7 KB)
- 📄 `admin/backup/page.js` (4.6 KB)
- 📄 `admin/categories/page.js` (5.1 KB)
- 📄 `admin/charts/page.js` (5.9 KB)
- 📄 `admin/communities/page.js` (7.7 KB)
- 📄 `admin/currency/page.js` (2.5 KB)
- 📄 `admin/emergency-contacts/page.js` (10.3 KB)
- 📄 `admin/entities/page.js` (8.0 KB)
- 📄 `admin/geography/page.js` (5.2 KB)
- 📄 `admin/login/page.js` (2.1 KB)
- 📄 `admin/maintenance/page.js` (0.2 KB)
- 📄 `admin/manage/[table]/page.js` (17.3 KB)
- 📄 `admin/manage/page.js` (2.2 KB)
- 📄 `admin/moderation/page.js` (11.6 KB)
- 📄 `admin/page.js` (7.8 KB)
- 📄 `admin/penalties/page.js` (7.9 KB)
- 📄 `admin/plans/page.js` (19.4 KB)
- 📄 `admin/reports/page.js` (2.9 KB)
- 📄 `admin/reviews/page.js` (0.1 KB)
- 📄 `admin/settings/page.js` (4.0 KB)
- 📄 `admin/sos/page.js` (4.2 KB)
- 📄 `admin/subscriptions/page.js` (0.1 KB)
- 📄 `admin/support/page.js` (5.9 KB)
- 📄 `admin/users/page.js` (0.2 KB)
- 📄 `ai/page.js` (4.8 KB)
- 📄 `auctions/page.js` (4.2 KB)
- 📄 `blood/page.js` (6.0 KB)
- 📄 `cart/page.js` (4.7 KB)
- 📄 `chat/[id]/page.js` (2.5 KB)
- 📄 `chat/page.js` (4.0 KB)
- 📄 `checkout/page.js` (12.2 KB)
- 📄 `club/[name]/page.js` (6.7 KB)
- 📄 `club/page.js` (4.1 KB)
- 📄 `customer/page.js` (10.0 KB)
- 📄 `delivery/page.js` (3.1 KB)
- 📄 `doctor/[name]/book/page.js` (14.0 KB)
- 📄 `doctor/[name]/page.js` (9.5 KB)
- 📄 `doctor/page.js` (5.4 KB)
- 📄 `elderly/page.js` (0.1 KB)
- 📄 `entity/[name]/page.js` (7.4 KB)
- 📄 `environment/page.js` (4.1 KB)
- 📄 `exchange/page.js` (10.6 KB)
- 📄 `expat/page.js` (0.1 KB)
- 📄 `favorites/page.js` (2.5 KB)
- 📄 `invoice/[id]/page.js` (6.1 KB)
- 📄 `jobs/page.js` (0.1 KB)
- 📄 `legal/api-terms/page.js` (1.2 KB)
- 📄 `legal/content-policy/page.js` (1.4 KB)
- 📄 `legal/cookies/page.js` (1.4 KB)
- 📄 `legal/dpa/page.js` (1.8 KB)
- 📄 `legal/gdpr/page.js` (1.4 KB)
- 📄 `legal/guidelines/page.js` (1.3 KB)
- 📄 `legal/partner/page.js` (1.1 KB)
- 📄 `legal/privacy/page.js` (3.1 KB)
- 📄 `legal/refund/page.js` (1.4 KB)
- 📄 `legal/sla/page.js` (1.3 KB)
- 📄 `legal/terms/page.js` (3.0 KB)
- 📄 `library/page.js` (0.1 KB)
- 📄 `login/page.js` (4.8 KB)
- 📄 `logout/page.js` (1.1 KB)
- 📄 `lostfound/page.js` (0.1 KB)
- 📄 `loyalty/page.js` (5.0 KB)
- 📄 `memory/page.js` (4.7 KB)
- 📄 `merchant/announcements/page.js` (0.2 KB)
- 📄 `merchant/appointments/page.js` (9.5 KB)
- 📄 `merchant/attendance/page.js` (9.0 KB)
- 📄 `merchant/auctions/new/page.js` (0.1 KB)
- 📄 `merchant/bookings/page.js` (11.9 KB)
- 📄 `merchant/budget/page.js` (15.5 KB)
- 📄 `merchant/chat/page.js` (2.3 KB)
- 📄 `merchant/circles/page.js` (0.2 KB)
- 📄 `merchant/class_files/page.js` (2.3 KB)
- 📄 `merchant/classes/[id]/files/new/page.js` (5.0 KB)
- 📄 `merchant/classes/new/page.js` (4.5 KB)
- 📄 `merchant/classes/page.js` (2.3 KB)
- 📄 `merchant/coupons/page.js` (0.1 KB)
- 📄 `merchant/customers/page.js` (10.0 KB)
- 📄 `merchant/debts/page.js` (14.3 KB)
- 📄 `merchant/delivery/page.js` (8.0 KB)
- 📄 `merchant/doctor_schedules/page.js` (0.2 KB)
- 📄 `merchant/documents/page.js` (10.4 KB)
- 📄 `merchant/donations/page.js` (0.2 KB)
- 📄 `merchant/elderly/new/page.js` (0.1 KB)
- 📄 `merchant/elderly_requests/page.js` (2.3 KB)
- 📄 `merchant/employees/page.js` (10.6 KB)
- 📄 `merchant/events/page.js` (7.3 KB)
- 📄 `merchant/exchange-rates/page.js` (10.5 KB)
- 📄 `merchant/expat/new/page.js` (0.1 KB)
- 📄 `merchant/fees/page.js` (12.0 KB)
- 📄 `merchant/grades/page.js` (0.2 KB)
- 📄 `merchant/hobbies/page.js` (6.8 KB)
- 📄 `merchant/import/page.js` (8.3 KB)
- 📄 `merchant/internet/invoices/page.js` (9.9 KB)
- 📄 `merchant/internet/page.js` (3.8 KB)
- 📄 `merchant/internet/plans/page.js` (6.2 KB)
- 📄 `merchant/internet/subscribers/page.js` (9.1 KB)
- 📄 `merchant/internet/tickets/page.js` (8.5 KB)
- 📄 `merchant/inventory/page.js` (5.8 KB)
- 📄 `merchant/invoices/page.js` (3.4 KB)
- 📄 `merchant/job_postings/page.js` (0.2 KB)
- 📄 `merchant/job_seekers/page.js` (2.3 KB)
- 📄 `merchant/jobs/new/page.js` (0.1 KB)
- 📄 `merchant/lessons/page.js` (0.2 KB)
- 📄 `merchant/library/new/page.js` (0.1 KB)
- 📄 `merchant/lostfound/new/page.js` (0.1 KB)
- 📄 `merchant/matches/new/page.js` (4.9 KB)
- 📄 `merchant/medical_records/page.js` (0.2 KB)
- 📄 `merchant/memory/new/page.js` (8.8 KB)
- 📄 `merchant/memory_items/page.js` (0.2 KB)
- 📄 `merchant/memory_places/page.js` (0.2 KB)
- 📄 `merchant/memory_stories/page.js` (0.2 KB)
- 📄 `merchant/moderation/page.js` (5.1 KB)
- 📄 `merchant/municipal/page.js` (8.3 KB)
- 📄 `merchant/office_requests/page.js` (0.2 KB)
- 📄 `merchant/oncall_shifts/page.js` (0.2 KB)
- 📄 `merchant/orders/page.js` (5.8 KB)
- 📄 `merchant/page.js` (15.1 KB)
- 📄 `merchant/payment_methods/page.js` (0.2 KB)
- 📄 `merchant/payments/page.js` (8.7 KB)
- 📄 `merchant/players/new/page.js` (4.2 KB)
- 📄 `merchant/prescriptions/page.js` (11.7 KB)
- 📄 `merchant/products/[id]/edit/page.js` (8.5 KB)
- 📄 `merchant/products/new/page.js` (10.9 KB)
- 📄 `merchant/products/page.js` (6.9 KB)
- 📄 `merchant/realestate/new/page.js` (0.1 KB)
- 📄 `merchant/referrals/page.js` (8.2 KB)
- 📄 `merchant/reminder-settings/page.js` (5.5 KB)
- 📄 `merchant/reports/page.js` (6.8 KB)
- 📄 `merchant/reviews/page.js` (6.9 KB)
- 📄 `merchant/school/page.js` (4.2 KB)
- 📄 `merchant/security/page.js` (8.4 KB)
- 📄 `merchant/sermons/page.js` (7.4 KB)
- 📄 `merchant/services/new/page.js` (10.1 KB)
- 📄 `merchant/settings/page.js` (11.5 KB)
- 📄 `merchant/sports-news/page.js` (4.8 KB)
- 📄 `merchant/sports_matches/page.js` (0.2 KB)
- 📄 `merchant/sports_players/page.js` (0.2 KB)
- 📄 `merchant/sports_standings/page.js` (0.2 KB)
- 📄 `merchant/students/page.js` (8.2 KB)
- 📄 `merchant/subjects/page.js` (6.5 KB)
- 📄 `merchant/subscription/page.js` (7.0 KB)
- 📄 `merchant/support/page.js` (5.8 KB)
- 📄 `merchant/teachers/new/page.js` (4.3 KB)
- 📄 `merchant/teachers/page.js` (5.9 KB)
- 📄 `merchant/tourism/new/page.js` (0.1 KB)
- 📄 `merchant/training/page.js` (6.3 KB)
- 📄 `merchant/utilities/page.js` (7.9 KB)
- 📄 `merchant/vehicles/new/page.js` (7.9 KB)
- 📄 `merchant/vehicles/page.js` (2.3 KB)
- 📄 `merchant/venues/page.js` (8.1 KB)
- 📄 `merchant/volunteers/page.js` (2.3 KB)
- 📄 `mosque/[name]/page.js` (6.1 KB)
- 📄 `mosque/page.js` (4.9 KB)
- 📄 `my-appointments/page.js` (5.7 KB)
- 📄 `news/[id]/page.js` (2.9 KB)
- 📄 `news/page.js` (4.1 KB)
- 📄 `notifications/page.js` (3.3 KB)
- 📄 `offline/page.js` (1.1 KB)
- 📄 `oncall/page.js` (2.6 KB)
- 📄 `order/[id]/page.js` (8.0 KB)
- 📄 `page.js` (26.1 KB)
- 📄 `plans/page.js` (10.8 KB)
- 📄 `product/[id]/page.js` (3.7 KB)
- 📄 `realestate/page.js` (0.1 KB)
- 📄 `register/page.js` (18.6 KB)
- 📄 `school/[name]/class/[id]/page.js` (4.1 KB)
- 📄 `school/[name]/page.js` (2.8 KB)
- 📄 `school/page.js` (4.4 KB)
- 📄 `search/page.js` (5.6 KB)
- 📄 `service/[id]/page.js` (10.1 KB)
- 📄 `sos/page.js` (12.5 KB)
- 📄 `store/[provider]/page.js` (8.2 KB)
- 📄 `stores/page.js` (9.7 KB)
- 📄 `tourism/page.js` (0.1 KB)

## 🧩 `src/components/` — المكونات

- `AdminNav.js` (3.7 KB)
- `AzkarBar.js` (3.9 KB)
- `Barcode.js` (0.4 KB)
- `ComingSoon.js` (1.6 KB)
- `Comments.js` (3.0 KB)
- `CommunityPicker.js` (2.1 KB)
- `CurrencyCalculator.js` (3.9 KB)
- `CustomerAuthModal.js` (12.7 KB)
- `DebtReminder.js` (2.7 KB)
- `FavoriteButton.js` (1.0 KB)
- `FileUpload.js` (2.8 KB)
- `FileUploader.js` (3.6 KB)
- `FlashDeals.js` (1.9 KB)
- `HeroCarousel.js` (2.8 KB)
- `HijriBar.js` (0.8 KB)
- `HijriDate.js` (4.3 KB)
- `ImageUploader.js` (3.4 KB)
- `InstallPrompt.js` (1.5 KB)
- `LanguageSwitcher.js` (1.8 KB)
- `NewsTicker.js` (0.7 KB)
- `NotificationListener.js` (1.9 KB)
- `NotificationSetup.js` (2.8 KB)
- `NotificationToggle.js` (3.7 KB)
- `OfflineIndicator.js` (1.1 KB)
- `PaymentMethodsSettings.js` (9.2 KB)
- `PrayerBar.js` (4.1 KB)
- `Reviews.js` (5.7 KB)
- `SectionForm.js` (6.2 KB)
- `SectionPage.js` (5.1 KB)
- `ServiceWorkerRegistrar.js` (0.6 KB)
- `ShareButtons.js` (4.3 KB)
- `Stars.js` (0.6 KB)
- `SubscriptionReminder.js` (3.3 KB)
- `Trans.js` (0.4 KB)

**الإجمالي: 34 مكوّن**

## 📚 `src/lib/` — المكتبات والأدوات

- `adminTables.js` (14.0 KB)
- `analytics.js` (0.9 KB)
- `auth.js` (7.1 KB)
- `barcode.js` (3.0 KB)
- `cart.js` (2.1 KB)
- `chat.js` (2.7 KB)
- `currency.js` (1.2 KB)
- `customerAuth.js` (5.1 KB)
- `entityConfig.js` (16.6 KB)
- `entityTables.js` (3.3 KB)
- `hijri.js` (1.0 KB)
- `i18n.js` (14.7 KB)
- `notify.js` (3.5 KB)
- `offline.js` (2.6 KB)
- `pdf.js` (1.8 KB)
- `permissions.js` (3.4 KB)
- `prayer.js` (4.3 KB)
- `print.js` (2.5 KB)
- `push-subscriptions.js` (4.0 KB)
- `push.js` (2.1 KB)
- `qr.js` (0.8 KB)
- `reviews.js` (2.9 KB)
- `sectionConfigs.js` (8.7 KB)
- `security.js` (4.6 KB)
- `share.js` (1.6 KB)
- `subscriptions.js` (2.9 KB)
- `supabase.js` (0.2 KB)
- `tenant.js` (1.2 KB)
- `upload.js` (1.5 KB)
- `useT.js` (0.5 KB)

**الإجمالي: 30 ملف**

## 🌐 `src/app/api/` — مسارات API

## 🔑 المكونات الحرجة

| المكوّن | الوظيفة |
|---------|---------|
| `HijriDate.js` | عرض التاريخ الهجري + الميلادي (Intl + fallback) |
| `HijriBar.js` | شريط التاريخ المصغّر في كل الصفحات |
| `AzkarBar.js` | شريط الأذكار المتغير |
| `NewsTicker.js` | شريط الأخبار المتحرك |
| `PrayerBar.js` | مواقيت الصلاة |
| `ImageUploader.js` | رفع الصور |
| `FileUploader.js` | رفع الملفات (PDF، إلخ) |
| `DebtReminder.js` | تنبيهات الديون |
| `SubscriptionReminder.js` | تنبيهات الاشتراكات |
| `NotificationListener.js` | استقبال الإشعارات |
| `NotificationSetup.js` | إعداد الإشعارات |
| `ServiceWorkerRegistrar.js` | تسجيل PWA |
| `InstallPrompt.js` | دعوة تثبيت التطبيق |
| `CommunityPicker.js` | اختيار المجتمع |
| `HeroCarousel.js` | البانر المتحرك |

## 📖 المكتبات المهمة

| الملف | الغرض |
|-------|-------|
| `supabase.js` | عميل Supabase |
| `auth.js` | المصادقة والتسجيل |
| `useT.js` | الترجمة (i18n hook) |
| `i18n.js` | قاموس الترجمة |
| `sectionConfigs.js` | تكوين الأقسام الديناميكية |
| `adminTables.js` | جداول لوحة الأدمن |
| `entityTables.js` | جداول المزودين |
| `entityConfig.js` | تكوين لوحات المزودين |
| `prayer.js` | حساب مواقيت الصلاة |
| `hijri.js` | تحويل التاريخ الهجري |
| `currency.js` | أسعار العملات |
| `cart.js` | سلة المشتريات |
| `chat.js` | المحادثات |
| `offline.js` | العمل بدون إنترنت |
| `upload.js` | رفع الملفات |
| `share.js` | المشاركة |
| `print.js` | الطباعة |
| `pdf.js` | توليد PDF |
| `qr.js` | QR Code |
| `barcode.js` | Barcode |
| `push.js` | Web Push |
| `push-subscriptions.js` | اشتراكات Push |
| `notify.js` | الإشعارات الداخلية |
| `reviews.js` | التقييمات |
| `permissions.js` | الصلاحيات |
| `security.js` | الحماية |
| `analytics.js` | التحليلات |
| `tenant.js` | المجتمع/الحي |
| `subscriptions.js` | الاشتراكات |
| `customerAuth.js` | مصادقة العملاء |

## 🗂️ الأقسام في Supabase (`service_categories`)

| # | الاسم | Slug | الأيقونة |
|---|-------|------|----------|
| 1 | المتاجر والتسوق | `shopping` | 🛍️ |
| 2 | الصحة والعيادات | `health` | ❤️ |
| 3 | التعليم | `education` | 🎓 |
| 4 | المساجد | `mosques` | 🕌 |
| 5 | البلدية والخدمات العامة | `municipality` | 🏢 |
| 6 | الجمعيات والمساعدات | `charities` | 🎁 |
| 7 | الأخبار والإعلانات | `news` | 📰 |
| 8 | الطوارئ | `emergency` | 🚨 |
| 9 | الرياضة | `sports` | ⚽ |
| 10 | المواصلات | `transport` | 🚗 |
| 11 | ذاكرة كنصفرة | `memory` | 📷 |
| 12 | المكتبة | `library` | 📚 |
| 13 | السياحة | `tourism` | 🏛️ |
| 14 | التوظيف | `jobs` | 💼 |
| 15 | العقارات | `realestate` | 🏠 |
| 16 | المفقودات | `lostfound` | 🔍 |
| 17 | كبار السن | `elderly` | 👴 |
| 18 | المغتربون | `expat` | 🌍 |
| 19 | المزادات | `auctions` | 🏆 |
| 20 | الصرافة والحوالات | `exchange` | 💱 |
| 21 | الحرفيون | `crafts` | 🛠️ |
| 22 | ورشات التصنيع | `workshops` | 🏭 |
| 23 | مزودو الإنترنت | `internet` | 📡 |

## 👥 أنواع المزودين (`ENTITY_TYPES`)

| # | المفتاح | الاسم | الأيقونة |
|---|---------|-------|----------|
| 1 | `merchant` | متجر / محل | 🏪 |
| 2 | `restaurant` | مطعم | 🍽️ |
| 3 | `doctor` | طبيب / عيادة | 👨‍⚕️ |
| 4 | `pharmacy` | صيدلية | 💊 |
| 5 | `school` | مدرسة / معهد | 🏫 |
| 6 | `mosque` | جامع | 🕌 |
| 7 | `charity` | جمعية خيرية | 🤝 |
| 8 | `sports` | نادي رياضي | ⚽ |
| 9 | `hotel` | فندق | 🏨 |
| 10 | `office` | مكتب خدمات | 📁 |
| 11 | `exchange` | مكتب صرافة | 💱 |
| 12 | `transport` | مواصلات | 🚗 |
| 13 | `memory` | ذاكرة رقمية | 📸 |
| 14 | `municipality` | بلدية | 🏢 |
| 15 | `craftsman` | حرفي | 🛠️ |
| 16 | `workshop` | ورشة تصنيع | 🏭 |
| 17 | `isp` | مزود إنترنت | 📡 |

## 🔒 قيد `entities_type_check` في Supabase

**الأنواع المسموحة (18 نوع):**

```
merchant, doctor, pharmacy, school, mosque, municipality,
council, charity, sports, memory, office, restaurant,
transport, exchange, hotel, craftsman, workshop, isp
```

**SQL لتحديثه إذا لزم:**
```sql
ALTER TABLE entities DROP CONSTRAINT entities_type_check;
ALTER TABLE entities ADD CONSTRAINT entities_type_check
CHECK (entity_type = ANY (ARRAY[
  'merchant','doctor','pharmacy','school','mosque','municipality',
  'council','charity','sports','memory','office','restaurant',
  'transport','exchange','hotel','craftsman','workshop','isp'
]));
```

## 🔐 متغيرات البيئة (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://pgjcmzvykolfzgdnzpdy.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## ⚙️ أوامر التشغيل

```bash
# التطوير
npm run dev        # next dev --webpack

# البناء للإنتاج
npm run build      # next build --webpack

# تشغيل الإنتاج
npm start          # next start
```

## ⚠️ ملاحظات حرجة

1. **Termux لا يدعم Turbopack** — استخدم `--webpack` دائمًا
2. **`@tailwindcss/postcss`** بدل `@tailwindcss/turbopack`
3. **الرئيسية** تستخدم DB فقط (لا fallback)
4. **`/register`** يستخدم `ENTITY_TYPES` ثابتة في الملف
5. **`HijriBar`** يظهر في كل الصفحات ما عدا الرئيسية
6. **`postcss.config.mjs`** مطلوب لـ Tailwind v4
7. **`layout.js`** يستورد `globals.css` ثم `premium.css`
8. **`premium.css`** لا يجب أن يحتوي `cat-tile` (نُقل لـ globals)

## 💾 النسخ الاحتياطية

```bash
# نسخة كاملة (بدون node_modules)
cd ~
tar --exclude=node_modules --exclude=.next -czf \
    ~/sanad-backup-$(date +%Y%m%d).tar.gz sanad/

# استرجاع
tar -xzf ~/sanad-backup-YYYYMMDD.tar.gz
```

