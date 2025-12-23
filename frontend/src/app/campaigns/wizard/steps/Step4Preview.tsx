'use client';
import { WizardData } from '../page';

interface Props {
    data: WizardData;
}

export default function Step4Preview({ data }: Props) {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-6">Review & Finalize</h2>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Campaign Type</dt>
                        <dd className="mt-1 text-sm text-gray-900">{data.type}</dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Name</dt>
                        <dd className="mt-1 text-sm text-gray-900">{data.name}</dd>
                    </div>

                    {data.type === 'NEWSLETTER' && (
                        <>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Audience List ID</dt>
                                <dd className="mt-1 text-sm text-gray-900">{data.emailListId || 'Not Selected'}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Subject</dt>
                                <dd className="mt-1 text-sm text-gray-900">{data.subject || 'Missing Subject'}</dd>
                            </div>
                        </>
                    )}

                    {data.type === 'META_AD' && (
                        <>
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Primary Text</dt>
                                <dd className="mt-1 text-sm text-gray-900">{data.primaryText || 'Missing Text'}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Headline</dt>
                                <dd className="mt-1 text-sm text-gray-900">{data.headline || 'Missing Headline'}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Targeting</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {data.targetAudience ? JSON.stringify(data.targetAudience) : 'None'}
                                </dd>
                            </div>
                        </>
                    )}
                </dl>
            </div>

            <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        ⚠️
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            {data.type === 'NEWSLETTER'
                                ? "This will immediately queue emails to all subscribers in the selected list. Double check your content."
                                : "This will save the ad as 'Ready'. You can export it or connect API later."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
