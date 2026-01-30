import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Blog - Glowify Baby Stores',
    description: 'Latest articles, parenting tips, and product updates from Glowify.',
};

export const revalidate = 3600; // Revalidate every hour

async function getPosts() {
    // Use internal URL for server-side fetching
    const apiUrl = process.env.INTERNAL_API_URL || 'http://backend:5000';

    try {
        const res = await fetch(`${apiUrl}/api/blog?published=true&limit=21`, {
            next: { revalidate: 3600 },
        });

        if (!res.ok) {
            // Fallback for empty state on error (e.g. DB not reachable yet)
            console.error('Failed to fetch posts:', res.statusText);
            return { posts: [] };
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return { posts: [] };
    }
}

export default async function BlogIndex() {
    const data = await getPosts();
    const posts = data.posts || [];

    if (posts.length === 0) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-semibold text-gray-900">No posts yet</h2>
                <p className="mt-4 text-gray-600">Check back soon for our latest updates!</p>
            </div>
        );
    }

    return (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post: any) => (
                <article key={post.id} className="flex flex-col items-start justify-between bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
                    {post.coverImage ? (
                        <div className="w-full h-48 relative bg-gray-100">
                            <img
                                src={post.coverImage}
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-full h-48 bg-Secondary-50 flex items-center justify-center text-Secondary-300">
                            <span className="text-4xl">✨</span>
                        </div>
                    )}

                    <div className="p-6 w-full flex-1 flex flex-col">
                        <div className="flex items-center gap-x-4 text-xs text-gray-500 mb-3">
                            <time dateTime={post.publishedAt}>
                                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : 'Draft'}
                            </time>
                            {post.author && (
                                <span>• {post.author.firstName}</span>
                            )}
                        </div>

                        <div className="group relative flex-1">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                                <Link href={`/blog/${post.slug}`}>
                                    <span className="absolute inset-0" />
                                    {post.title}
                                </Link>
                            </h3>
                            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600">
                                {post.excerpt}
                            </p>
                        </div>

                        <div className="mt-6 flex items-center text-primary-600 text-sm font-medium">
                            Read Article
                            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}
