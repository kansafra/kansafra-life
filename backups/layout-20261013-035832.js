import "./globals.css";

export const metadata = {
  title: "سند SANAD | خدماتك في مكان واحد",
  description:
    "سند منصة خدمية تجمع الخدمات المحلية والإعلانات والمعلومات المفيدة في مكان واحد.",
  applicationName: "SANAD",
  appleWebApp: {
    capable: true,
    title: "سند",
    statusBarStyle: "default",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#087f5b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
