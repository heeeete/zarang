import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/write', '/me', '/messages', '/api', '/auth', '/login'],
    },
    sitemap: 'https://zarang.co.kr/sitemap.xml',
  };
}
