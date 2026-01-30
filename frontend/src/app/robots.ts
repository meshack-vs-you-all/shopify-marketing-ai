import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/blog/',
            disallow: ['/dashboard/', '/api/', '/settings/'],
        },
        sitemap: 'https://marketing.glowifybabystores.com/sitemap.xml',
    };
}
