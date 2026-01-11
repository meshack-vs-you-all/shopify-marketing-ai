''''use client';
import { WizardData } from '@/hooks/useCampaignWizard';

interface Props {
    data: WizardData;
    updateData: (data: Partial<WizardData>) => void;
}

const campaignTypes = [
    {
        type: 'NEWSLETTER',
        title: 'Email Newsletter',
        description: 'Send rich HTML emails to your audience lists. Great for announcements, newsletters, and promotions.',
        icon: '📧'
    },
    {
        type: 'META_AD',
        title: 'Meta Ad',
        description: 'Create Facebook and Instagram ads. Prepare copy, creative, and targeting parameters for export or API integration.',
        icon: '📢'
    }
];

const CampaignTypeCard = ({ type, title, description, icon, selected, onClick }) => (
    <div
        onClick={onClick}
        className={`cursor-pointer border-2 rounded-lg p-6 transition-all ${selected ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
        <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">{icon}</span>
            <h3 className="text-lg font-medium">{title}</h3>
        </div>
        <p className="text-gray-600 text-sm">{description}</p>
    </div>
);

export default function Step1Type({ data, updateData }: Props) {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-6">Select Campaign Type</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaignTypes.map(campaignType => (
                    <CampaignTypeCard
                        key={campaignType.type}
                        {...campaignType}
                        selected={data.type === campaignType.type}
                        onClick={() => updateData({ type: campaignType.type })}
                    />
                ))}
            </div>

            <div className="mt-8">
                <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700">Campaign Name</label>
                <input
                    id="campaignName"
                    name="campaignName"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    placeholder="e.g. Summer Sale 2024"
                    value={data.name}
                    onChange={(e) => updateData({ name: e.target.value })}
                />
            </div>
        </div>
    );
}
''''