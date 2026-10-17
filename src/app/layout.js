export const dynamic = 'force-dynamic';
import './globals.css';
import './premium.css';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import InstallPrompt from '@/components/InstallPrompt';
import NotificationSetup from '@/components/NotificationSetup';
import AzkarBar from '@/components/AzkarBar';
import NotificationListener from '@/components/NotificationListener';
import SubscriptionReminder from '@/components/SubscriptionReminder';
import DebtReminder from '@/components/DebtReminder';
import HijriBar from '@/components/HijriBar';

export const metadata = {
  manifest: '/manifest.json',
  title: 'سند | خدماتك أقرب',
  description: 'سند يجمع الخدمات المحلية والمتاجر والاحتياجات اليومية في مكان واحد.',
  applicationName: 'سند',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'سند' },
  formatDetection: { telephone: false },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f4d3a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <HijriBar />
        {children}
        <AzkarBar />
        <NotificationListener />
        <SubscriptionReminder />
        <DebtReminder />
        <ServiceWorkerRegistrar />
        <InstallPrompt />
        <NotificationSetup />
      </body>
    </html>
  );
}
