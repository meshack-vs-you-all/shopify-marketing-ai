import { MetadataRoute } from 'next';

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const apiUrl = process.env.INTERNAL_API_URL || 'http://backend:5000';
    const baseUrl = 'https://marketing.glowifybabystores.com';

    let posts: any[] = [];

    try {
        // Fetch all published posts
        const res = await fetch(`${apiUrl}/api/blog?published=true&limit=1000`, {
            next: { revalidate: 3600 }
        });

        if (res.ok) {
            const data = await res.json();
            posts = data.posts || [];
        }
    } catch (e) {
        console.error('Sitemap fetch failed', e);
    }

    const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt || new Date()),
        changeFrequency: 'weekly',
        priority: 0.7,
    }));

    return [
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        ...blogEntries,
    ];
}
