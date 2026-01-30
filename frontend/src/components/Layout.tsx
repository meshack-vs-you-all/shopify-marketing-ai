'use client';

import { useAuth } from './AuthProvider';
import Sidebar from './Sidebar';
import { usePathname } from 'next/navigation';

export function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  // Define public paths where sidebar should NOT be shown even if authenticated
  const publicPaths = ['/', '/login', '/signup', '/setup-guide'];
  const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/blog');

  if (!isAuthenticated || isPublicPath) {
    return <main className="min-h-screen bg-cream-100">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

