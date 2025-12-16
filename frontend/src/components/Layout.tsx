'use client';

import { useAuth } from './AuthProvider';
import Sidebar from './Sidebar';

export function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
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

