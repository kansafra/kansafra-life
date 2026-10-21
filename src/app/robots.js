export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sanad.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/merchant/',
          '/api/',
          '/checkout',
          '/cart',
          '/customer',
          '/notifications',
          '/_next/',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
