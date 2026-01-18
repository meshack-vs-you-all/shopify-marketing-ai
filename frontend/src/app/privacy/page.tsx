'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Shopify Marketing AI';
    const contactEmail = 'support@glowify.com';
    const lastUpdated = 'January 18, 2026';

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
                <p className="text-sm text-gray-500 mb-8">Last updated: {lastUpdated}</p>

                <div className="prose prose-gray max-w-none">
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Welcome to {appName}. We respect your privacy and are committed to protecting your personal data.
                            This privacy policy explains how we collect, use, and safeguard your information when you use our
                            AI-powered marketing platform.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">We collect the following types of information:</p>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2">
                            <li><strong>Account Information:</strong> Email address, name, and profile picture when you sign in with Google.</li>
                            <li><strong>Shopify Store Data:</strong> Product information, store analytics, and order data from your connected Shopify store.</li>
                            <li><strong>Campaign Data:</strong> Email campaigns, ad content, and marketing materials you create using our platform.</li>
                            <li><strong>Usage Data:</strong> How you interact with our platform, including features used and actions taken.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">We use your information to:</p>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2">
                            <li>Provide and improve our AI-powered marketing services</li>
                            <li>Generate personalized marketing content based on your store data</li>
                            <li>Send email campaigns on your behalf to your subscribers</li>
                            <li>Analyze campaign performance and provide insights</li>
                            <li>Communicate with you about your account and our services</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Sharing</h2>
                        <p className="text-gray-700 leading-relaxed">
                            We do not sell your personal data. We may share data with:
                        </p>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
                            <li><strong>Service Providers:</strong> AWS (email sending), OpenRouter (AI generation), and other infrastructure providers.</li>
                            <li><strong>Shopify:</strong> To sync your store data.</li>
                            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
                        <p className="text-gray-700 leading-relaxed">
                            We implement industry-standard security measures to protect your data, including encryption in transit
                            (HTTPS) and at rest, secure authentication, and regular security audits.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2">
                            <li>Access and download your personal data</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Request deletion of your account and data</li>
                            <li>Withdraw consent for data processing</li>
                            <li>Object to automated decision-making</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Cookies</h2>
                        <p className="text-gray-700 leading-relaxed">
                            We use essential cookies for authentication and session management. We do not use third-party
                            tracking cookies without your consent.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
                        <p className="text-gray-700 leading-relaxed">
                            If you have questions about this privacy policy or your data, please contact us at{' '}
                            <a href={`mailto:${contactEmail}`} className="text-primary-600 hover:underline">
                                {contactEmail}
                            </a>.
                        </p>
                    </section>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
