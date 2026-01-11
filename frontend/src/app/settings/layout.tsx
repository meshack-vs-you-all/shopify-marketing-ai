'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    UserCircleIcon,
    GlobeAltIcon,
    KeyIcon,
    EnvelopeIcon,
    MegaphoneIcon,
    ServerIcon,
    BellIcon,
    CreditCardIcon,
    CpuChipIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/Card';

const settingsNav = [
    { name: 'General', href: '/settings/general', icon: GlobeAltIcon },
    { name: 'Account & Access', href: '/settings/account', icon: UserCircleIcon },
    { name: 'Authentication', href: '/settings/auth', icon: KeyIcon },
    { name: 'Email & Sending', href: '/settings/email', icon: EnvelopeIcon },
    { name: 'Meta Ads', href: '/settings/meta', icon: MegaphoneIcon },
    { name: 'AI & Automations', href: '/settings/ai', icon: CpuChipIcon },
    { name: 'Notifications', href: '/settings/notifications', icon: BellIcon, disabled: true },
    { name: 'Billing', href: '/settings/billing', icon: CreditCardIcon, hidden: true },
    { name: 'System', href: '/settings/system', icon: CpuChipIcon },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Settings Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <Card className="p-2">
                        <nav className="space-y-1">
                            {settingsNav.filter(item => !item.hidden).map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.disabled ? '#' : item.href}
                                        className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive
                                                ? 'bg-primary-50 text-primary-700'
                                                : item.disabled
                                                    ? 'text-gray-400 cursor-not-allowed'
                                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                                        onClick={(e) => item.disabled && e.preventDefault()}
                                    >
                                        <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </Card>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}
