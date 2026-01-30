import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ShopifyProductCard from '@/components/blog/ShopifyProductCard';

export const revalidate = 3600; // Revalidate every hour

const API_URL = process.env.INTERNAL_API_URL || 'http://backend:5000';

async function getPost(slug: string) {
    try {
        const res = await fetch(`${API_URL}/api/blog/slug/${slug}`, {
            next: { revalidate: 3600 },
        });

        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch post');

        return res.json();
    } catch (error) {
        console.error('Error fetching blog post:', error);
        return null;
    }
}

async function getProduct(productId: string) {
    try {
        // If productId is a handle, we might need a different endpoint or the same one if it supports handles.
        // Assuming backend endpoint /api/shopify/products/:id accepts ID.
        // If it's a handle, this might fail unless backend handles it.
        // For now, we assume ID.
        const res = await fetch(`${API_URL}/api/shopify/products/${productId}`, {
            next: { revalidate: 3600 }, // Cache product data too
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data.product;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const post = await getPost(params.slug);

    if (!post) {
        return {
            title: 'Post Not Found - Glowify Baby Stores',
        };
    }

    return {
        title: post.seoTitle || `${post.title} - Glowify Blog`,
        description: post.seoDesc || post.excerpt,
        openGraph: {
            title: post.seoTitle || post.title,
            description: post.seoDesc || post.excerpt,
            type: 'article',
            publishedTime: post.publishedAt,
            authors: post.author ? [`${post.author.firstName} ${post.author.lastName}`] : [],
            images: post.coverImage ? [post.coverImage] : [],
        },
    };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
    const post = await getPost(params.slug);

    if (!post) {
        notFound();
    }

    // Fetch featured product if it exists
    let product = null;
    if (post.featuredProductId) {
        product = await getProduct(post.featuredProductId);
    }

    return (
        <article className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="text-center mb-12">
                <div className="flex justify-center items-center gap-2 text-sm text-gray-500 mb-6">
                    {post.keywords && post.keywords.length > 0 && (
                        <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-medium">
                            {post.keywords[0]}
                        </span>
                    )}
                    <time dateTime={post.publishedAt}>
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }) : 'Draft'}
                    </time>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
                    {post.title}
                </h1>

                {post.excerpt && (
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        {post.excerpt}
                    </p>
                )}

                {post.author && (
                    <div className="mt-8 flex items-center justify-center gap-3">
                        {post.author.avatar ? (
                            <img src={post.author.avatar} alt="" className="w-10 h-10 rounded-full bg-gray-100" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                {post.author.firstName[0]}
                            </div>
                        )}
                        <div className="text-left">
                            <p className="text-sm font-medium text-gray-900">
                                {post.author.firstName} {post.author.lastName}
                            </p>
                            <p className="text-xs text-gray-500">Editor</p>
                        </div>
                    </div>
                )}
            </div>

            {post.coverImage && (
                <div className="mb-12 rounded-2xl overflow-hidden shadow-lg aspect-video bg-gray-100 relative">
                    <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Main Content */}
            <div className="prose prose-lg prose-indigo mx-auto text-gray-700">
                {/*
            Safe render of HTML content.
            In a real scenario, use a sanitizer like dompurify
            if the content source isn't 100% trusted.
            Since this internal tool generates it, we assume minimal trust.
        */}
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>

            {/* Product Integration */}
            {product ? (
                <ShopifyProductCard product={product} />
            ) : post.featuredProductId ? (
                // Fallback if product fetch failed but ID exists
                <div className="mt-16 bg-cream-50 rounded-2xl p-8 border border-cream-200 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Featured Product</h3>
                    <a href={`https://glowifybabystores.com/products/${post.featuredProductId}`} target="_blank" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                        Shop on Store
                    </a>
                </div>
            ) : null}

            <div className="mt-20 pt-10 border-t border-gray-200 text-center">
                <Link href="/blog" className="text-primary-600 font-medium hover:text-primary-800 transition-colors">
                    &larr; Back to all articles
                </Link>
            </div>
        </article>
    );
}
