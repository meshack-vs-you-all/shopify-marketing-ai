''''use client';
import { WizardData } from '@/hooks/useCampaignWizard';
import { useState } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import NewsletterContent from './content/NewsletterContent';
import MetaAdContent from './content/MetaAdContent';

interface Props {
    data: WizardData;
    updateData: (data: Partial<WizardData>) => void;
}

export default function Step3Content({ data, updateData }: Props) {
    const [generating, setGenerating] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 font-display">Craft Content</h2>
                <p className="text-gray-500 text-sm mt-1">Write compelling copy or let AI handle the heavy lifting.</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center gap-2 text-sm">
                    <ExclamationCircleIcon className="w-5 h-5" />
                    {error}
                </div>
            )}

            {data.type === 'NEWSLETTER' ? (
                <NewsletterContent 
                    data={data} 
                    updateData={updateData} 
                    generating={generating} 
                    setGenerating={setGenerating} 
                    setError={setError} 
                />
            ) : (
                <MetaAdContent 
                    data={data} 
                    updateData={updateData} 
                    generating={generating} 
                    setGenerating={setGenerating} 
                    setError={setError} 
                />
            )}
        </div>
    );
}
''''