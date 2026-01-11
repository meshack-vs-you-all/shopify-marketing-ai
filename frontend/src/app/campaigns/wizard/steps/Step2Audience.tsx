''''use client';
import { WizardData } from '@/hooks/useCampaignWizard';
import NewsletterAudience from './audience/NewsletterAudience';
import MetaAdAudience from './audience/MetaAdAudience';

interface Props {
    data: WizardData;
    updateData: (data: Partial<WizardData>) => void;
}

export default function Step2Audience({ data, updateData }: Props) {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-6">Audience Selection</h2>

            {data.type === 'NEWSLETTER' ? (
                <NewsletterAudience data={data} updateData={updateData} />
            ) : (
                <MetaAdAudience data={data} updateData={updateData} />
            )}
        </div>
    );
}
''''