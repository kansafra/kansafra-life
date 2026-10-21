export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sanad.app';
  const now = new Date();

  const staticPages = [
    { url: '', priority: 1.0, changeFrequency: 'daily' },
    { url: '/categories', priority: 0.9, changeFrequency: 'weekly' },
    { url: '/stores', priority: 0.9, changeFrequency: 'daily' },
    { url: '/search', priority: 0.7, changeFrequency: 'weekly' },
    { url: '/doctor', priority: 0.8, changeFrequency: 'weekly' },
    { url: '/school', priority: 0.8, changeFrequency: 'weekly' },
    { url: '/mosque', priority: 0.8, changeFrequency: 'weekly' },
    { url: '/news', priority: 0.8, changeFrequency: 'daily' },
    { url: '/jobs', priority: 0.8, changeFrequency: 'daily' },
    { url: '/realestate', priority: 0.8, changeFrequency: 'daily' },
    { url: '/library', priority: 0.7, changeFrequency: 'weekly' },
    { url: '/tourism', priority: 0.7, changeFrequency: 'weekly' },
    { url: '/lostfound', priority: 0.7, changeFrequency: 'daily' },
    { url: '/auctions', priority: 0.7, changeFrequency: 'daily' },
    { url: '/exchange', priority: 0.7, changeFrequency: 'daily' },
    { url: '/sos', priority: 0.9, changeFrequency: 'hourly' },
    { url: '/blood', priority: 0.9, changeFrequency: 'hourly' },
    { url: '/memory', priority: 0.6, changeFrequency: 'weekly' },
    { url: '/login', priority: 0.5, changeFrequency: 'monthly' },
    { url: '/register', priority: 0.6, changeFrequency: 'monthly' },
    { url: '/legal/terms', priority: 0.4, changeFrequency: 'yearly' },
    { url: '/legal/privacy', priority: 0.4, changeFrequency: 'yearly' },
  ];

  return staticPages.map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
