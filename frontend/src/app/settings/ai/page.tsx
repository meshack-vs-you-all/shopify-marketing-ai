'use client';

import { Card } from '@/components/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';

export default function AiSettingsPage() {
    return (
        <Card>
            <Card.Header>
                <h2 className="text-xl font-bold">AI & Automation Settings</h2>
                <p className="text-sm text-gray-500">
                    Configure the AI models and providers used for content generation, optimization, and reporting.
                </p>
            </Card.Header>
            <Card.Content className="space-y-6">
                <div className="space-y-2">
                    <h3 className="text-lg font-medium">Content Generation Provider</h3>
                    <p className="text-sm text-gray-500">
                        Select the primary AI provider for generating ad copy, email content, and other creative assets.
                    </p>
                    <Select defaultValue="gemini">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gemini">Google Gemini</SelectItem>
                            <SelectItem value="openai" disabled>OpenAI (Coming Soon)</SelectItem>
                            <SelectItem value="anthropic" disabled>Anthropic (Coming Soon)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <h3 className="text-lg font-medium">Image Generation Provider</h3>
                     <p className="text-sm text-gray-500">
                        Select the provider for generating images for your campaigns.
                    </p>
                    <Select defaultValue="placeholder">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="placeholder">Placeholder</SelectItem>
                            <SelectItem value="stability">Stability AI</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card.Content>
        </Card>
    );
}
