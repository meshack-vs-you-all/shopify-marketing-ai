'use client';

import { Card } from '@/components/Card';

export default function AiSettingsPage() {
    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Content Generation Provider</h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                    </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                    The AI provider used for generating ad copy, email content, and other creative assets.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">Google Gemini</p>
                            <p className="text-sm text-gray-500">gemini-flash-lite-latest</p>
                        </div>
                        <span className="text-sm text-gray-400">Default provider</span>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Image Generation Provider</h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                    The provider used for generating images for your campaigns.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">Placeholder Provider</p>
                            <p className="text-sm text-gray-500">Returns placeholder images for development</p>
                        </div>
                        <span className="text-sm text-gray-400">Configurable via env</span>
                    </div>
                </div>
            </Card>

            <Card className="bg-gradient-to-r from-primary-50 to-accent-50 border-primary-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Additional Providers</h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Coming Soon
                    </span>
                </div>
                <p className="text-sm text-gray-600">
                    Support for OpenAI GPT-4, Anthropic Claude, and custom providers will be added in future updates.
                    Provider selection and API key management will be configurable here.
                </p>
            </Card>
        </div>
    );
}
