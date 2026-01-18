'use client';

import Link from 'next/link';

export default function TermsOfServicePage() {
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Shopify Marketing AI';
    const contactEmail = 'support@glowify.com';
    const lastUpdated = 'January 18, 2026';

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
                <p className="text-sm text-gray-500 mb-8">Last updated: {lastUpdated}</p>

                <div className="prose prose-gray max-w-none">
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                        <p className="text-gray-700 leading-relaxed">
                            By accessing or using {appName} ("the Service"), you agree to be bound by these Terms of Service.
                            If you do not agree to these terms, do not use the Service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
                        <p className="text-gray-700 leading-relaxed">
                            {appName} is an AI-powered marketing platform that helps Shopify store owners create and manage
                            email campaigns, advertisements, and marketing content. The Service integrates with your Shopify
                            store to generate personalized marketing materials.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">To use the Service, you must:</p>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2">
                            <li>Provide accurate and complete registration information</li>
                            <li>Maintain the security of your account credentials</li>
                            <li>Be at least 18 years old or have parental consent</li>
                            <li>Accept responsibility for all activities under your account</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">You agree NOT to:</p>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2">
                            <li>Send spam or unsolicited marketing emails</li>
                            <li>Use the Service for illegal or fraudulent purposes</li>
                            <li>Violate any applicable anti-spam laws (CAN-SPAM, GDPR, etc.)</li>
                            <li>Upload malicious content or attempt to hack the Service</li>
                            <li>Resell or redistribute the Service without authorization</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">5. AI-Generated Content</h2>
                        <p className="text-gray-700 leading-relaxed">
                            The Service uses artificial intelligence to generate marketing content. While we strive for accuracy,
                            AI-generated content may contain errors. You are responsible for reviewing and approving all content
                            before publishing. We are not liable for any damages resulting from AI-generated content.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
                        <p className="text-gray-700 leading-relaxed">
                            You retain ownership of your store data and content. You grant us a license to use this data solely
                            to provide the Service. AI-generated content created using the Service belongs to you.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Third-Party Services</h2>
                        <p className="text-gray-700 leading-relaxed">
                            The Service integrates with third-party platforms (Shopify, Meta, Google, AWS). Your use of these
                            integrations is subject to their respective terms of service. We are not responsible for third-party
                            service availability or actions.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
                        <p className="text-gray-700 leading-relaxed">
                            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE ARE NOT LIABLE FOR ANY INDIRECT,
                            INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Termination</h2>
                        <p className="text-gray-700 leading-relaxed">
                            We may suspend or terminate your access to the Service at any time for violation of these terms.
                            You may cancel your account at any time. Upon termination, your data will be deleted in accordance
                            with our Privacy Policy.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
                        <p className="text-gray-700 leading-relaxed">
                            We may update these terms from time to time. We will notify you of significant changes via email
                            or through the Service. Continued use after changes constitutes acceptance.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact</h2>
                        <p className="text-gray-700 leading-relaxed">
                            For questions about these terms, contact us at{' '}
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
