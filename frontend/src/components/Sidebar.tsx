'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import {
    HomeIcon,
    MegaphoneIcon,
    EnvelopeIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    UserCircleIcon,
    Bars3Icon,
    XMarkIcon,
    ArrowRightOnRectangleIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();

    const navigation = [
        { name: 'Overview', href: '/dashboard', icon: HomeIcon },
        { name: 'Ad Campaigns', href: '/campaigns', icon: MegaphoneIcon },
        { name: 'AI Studio', href: '/ai-studio', icon: SparklesIcon },
        { name: 'Email Marketing', href: '/email/dashboard', icon: EnvelopeIcon },
        { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
        { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
    ];

    const getUserInitials = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        }
        if (user?.email) {
            return user.email[0].toUpperCase();
        }
        return 'U';
    };

    const getUserDisplayName = () => {
        if (user?.firstName) {
            return `${user.firstName} ${user.lastName || ''}`.trim();
        }
        return user?.email || 'User';
    };

    return (
        <>
            {/* Mobile Toggle */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-md bg-white shadow-md text-gray-600 hover:text-primary-600"
                >
                    {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                </button>
            </div>

            {/* Sidebar Overlay (Mobile) */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
        fixed top-0 left-0 h-full w-64 bg-cream-100 dark:bg-cream-900 border-r border-cream-200 dark:border-cream-800 z-40 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-cream-200 dark:border-cream-800 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                        <span className="text-xl font-bold bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
                            Glowify AI
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors
                    ${isActive
                                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-cream-200 dark:hover:bg-cream-800 hover:text-gray-900 dark:hover:text-white'}
                  `}
                                >
                                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile & Logout (Bottom) */}
                    <div className="p-4 border-t border-cream-200 dark:border-cream-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center min-w-0">
                                <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm">
                                    {getUserInitials()}
                                </div>
                                <div className="ml-3 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                                        {getUserDisplayName()}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {user?.role || 'Admin'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Logout"
                            >
                                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

