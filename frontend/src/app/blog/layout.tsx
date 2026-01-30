import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <header className="mb-12 border-b border-gray-200 pb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        <Link href="/blog" className="hover:text-primary-600 transition-colors">
                            Glowify Blog
                        </Link>
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Insights, tips, and news for your baby's comfort.
                    </p>
                </div>
                <div className="flex gap-4">
                    {/* Link back to store home */}
                    <a href="https://glowifybabystores.com" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                        Shop Store
                    </a>
                </div>
            </header>

            <main>
                {children}
            </main>

            <footer className="mt-16 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
                <p>&copy; {new Date().getFullYear()} Glowify Baby Stores. All rights reserved.</p>
            </footer>
        </div>
    );
}
