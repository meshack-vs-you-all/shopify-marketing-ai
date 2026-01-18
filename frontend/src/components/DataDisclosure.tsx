'use client';

import { useState } from 'react';
import Link from 'next/link';

interface DataDisclosureProps {
    onAccept: () => void;
    onDecline?: () => void;
    compact?: boolean;
}

/**
 * Data Disclosure Component (B3 requirement)
 * 
 * Displays Google data usage disclosure during auth/onboarding.
 * Required for Google OAuth compliance.
 */
export function DataDisclosure({ onAccept, onDecline, compact = false }: DataDisclosureProps) {
    const [accepted, setAccepted] = useState(false);

    const handleAccept = () => {
        setAccepted(true);
        onAccept();
    };

    if (compact) {
        return (
            <div className="text-xs text-gray-500 mt-4 px-2">
                <p>
                    By signing in, you agree to our{' '}
                    <Link href="/terms" className="text-primary-600 hover:underline">Terms</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>.
                    We use your Google account info (email, name, profile picture) to create your account.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 max-w-md mx-auto my-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🔐 How We Use Your Data
            </h3>

            <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <p>
                        <strong>Google Account:</strong> We use your email, name, and profile picture
                        to create and manage your account.
                    </p>
                </div>

                <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <p>
                        <strong>Shopify Data:</strong> We access your store's products, orders, and
                        analytics to power AI-generated marketing content.
                    </p>
                </div>

                <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <p>
                        <strong>Email Communication:</strong> We send marketing emails on your behalf
                        to your subscriber lists.
                    </p>
                </div>

                <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <p>
                        <strong>AI Content:</strong> Your store data is used to generate personalized
                        marketing materials. Content is stored securely.
                    </p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                <p>
                    Read our full{' '}
                    <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
                    {' '}and{' '}
                    <Link href="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>.
                </p>
            </div>

            <div className="mt-4 flex gap-3">
                <button
                    onClick={handleAccept}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                    I Understand
                </button>
                {onDecline && (
                    <button
                        onClick={onDecline}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Compact disclosure for embedding below sign-in buttons
 */
export function CompactDataDisclosure() {
    return (
        <p className="text-xs text-gray-500 text-center mt-4 max-w-xs mx-auto">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-primary-600 hover:underline">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>.
            We'll use your email, name, and profile picture from Google to create your account.
        </p>
    );
}

export default DataDisclosure;
