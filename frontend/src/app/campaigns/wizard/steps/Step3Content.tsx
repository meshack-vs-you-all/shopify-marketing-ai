'use client';
import { WizardData } from '../page';
import { useState } from 'react';

interface Props {
    data: WizardData;
    updateData: (data: Partial<WizardData>) => void;
}

export default function Step3Content({ data, updateData }: Props) {
    // Simplistic local state for preview toggle if needed, but mostly direct updates

    return (
        <div>
            <h2 className="text-xl font-semibold mb-6">Content Creation</h2>

            {data.type === 'NEWSLETTER' ? (
                <div className="space-y-6">
                    <div>
                        <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-700">Subject Line</label>
                        <input
                            id="emailSubject"
                            name="emailSubject"
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            value={data.subject || ''}
                            onChange={(e) => updateData({ subject: e.target.value })}
                            placeholder="Enter a catchy subject..."
                        />
                        <button type="button" className="mt-2 text-xs text-indigo-600 hover:text-indigo-800">
                            ✨ Generate with AI
                        </button>
                    </div>

                    <div>
                        <label htmlFor="emailBody" className="block text-sm font-medium text-gray-700">Email Body (HTML)</label>
                        <textarea
                            id="emailBody"
                            name="emailBody"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 h-64 font-mono text-sm"
                            value={data.htmlContent || ''}
                            onChange={(e) => updateData({ htmlContent: e.target.value })}
                            placeholder="<h1>Hello World</h1>"
                        />
                        <button type="button" className="mt-2 text-xs text-indigo-600 hover:text-indigo-800">
                            ✨ Generate body with AI
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Meta Ad Spec</h4>
                        <p className="text-xs text-gray-500">
                            Primary Text: Appears above/below image. <br />
                            Headline: Bold text next to CTA. <br />
                            Description: Small text below headline.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="adPrimaryText" className="block text-sm font-medium text-gray-700">Primary Text</label>
                        <textarea
                            id="adPrimaryText"
                            name="adPrimaryText"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 h-24"
                            value={data.primaryText || ''}
                            onChange={(e) => updateData({ primaryText: e.target.value })}
                            placeholder="The main ad copy..."
                        />
                        <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-500">{(data.primaryText || '').length} chars</span>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="adHeadline" className="block text-sm font-medium text-gray-700">Headline</label>
                        <input
                            id="adHeadline"
                            name="adHeadline"
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            value={data.headline || ''}
                            onChange={(e) => updateData({ headline: e.target.value })}
                            placeholder="Chat with customers now"
                        />
                    </div>

                    <div>
                        <label htmlFor="adDescription" className="block text-sm font-medium text-gray-700">Description</label>
                        <input
                            id="adDescription"
                            name="adDescription"
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            value={data.description || ''}
                            onChange={(e) => updateData({ description: e.target.value })}
                            placeholder="Optional detail text"
                        />
                    </div>

                    <div>
                        <label htmlFor="adCreativeUrl" className="block text-sm font-medium text-gray-700">Creative URL</label>
                        <input
                            id="adCreativeUrl"
                            name="adCreativeUrl"
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            value={data.creativeUrl || ''}
                            onChange={(e) => updateData({ creativeUrl: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
