export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sanad.app';

  // الصفحات الثابتة
  const staticPages = [
    '', 'stores', 'search', 'categories', 'doctor', 'pharmacy',
    'school', 'mosque', 'municipal', 'charity', 'news', 'sports',
    'transport', 'memory', 'library', 'tourism', 'jobs',
    'realestate', 'lostfound', 'elderly', 'expat', 'auctions',
    'exchange', 'crafts', 'workshops', 'internet', 'club',
    'blood', 'oncall', 'sos', 'tourism', 'plans', 'privacy', 'terms',
  ];

  const routes = staticPages.map(route => ({
    url: `${baseUrl}/${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : 0.8,
  }));

  return routes;
}
