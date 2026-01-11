''''use client';
import { WizardData } from '@/hooks/useCampaignWizard';
import EmailPreview from './preview/EmailPreview';
import MetaAdPreview from './preview/MetaAdPreview';

interface Props {
    data: WizardData;
}

export default function Step4Preview({ data }: Props) {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-6">Review & Finalize</h2>

            {data.type === 'NEWSLETTER' ? (
                <EmailPreview htmlContent={data.htmlContent || ''} />
            ) : (
                <MetaAdPreview 
                    headline={data.headline || ''} 
                    primaryText={data.primaryText || ''} 
                    creativeUrl={data.creativeUrl || ''}
                />
            )}

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
''''