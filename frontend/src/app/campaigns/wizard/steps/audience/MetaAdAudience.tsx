''''use client';
import { WizardData } from '@/hooks/useCampaignWizard';

interface Props {
    data: WizardData;
    updateData: (data: Partial<WizardData>) => void;
}

export default function MetaAdAudience({ data, updateData }: Props) {
    return (
        <div>
            <p className="mb-4 text-gray-600">Define targeting parameters for your Meta Ad.</p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <label htmlFor="targetLocation" className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                        id="targetLocation"
                        name="targetLocation"
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        placeholder="e.g. United States, New York"
                        value={data.targetAudience?.location || ''}
                        onChange={(e) => updateData({ targetAudience: { ...data.targetAudience, location: e.target.value } })}
                    />
                </div>
                <div>
                    <span id="ageRangeLabel" className="block text-sm font-medium text-gray-700">Age Range</span>
                    <div className="flex space-x-2" aria-labelledby="ageRangeLabel">
                        <input
                            id="ageMin"
                            name="ageMin"
                            type="number"
                            aria-label="Minimum Age"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            placeholder="Min (e.g. 18)"
                            value={data.targetAudience?.ageMin || ''}
                            onChange={(e) => updateData({ targetAudience: { ...data.targetAudience, ageMin: e.target.value } })}
                        />
                        <input
                            id="ageMax"
                            name="ageMax"
                            type="number"
                            aria-label="Maximum Age"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            placeholder="Max (e.g. 65)"
                            value={data.targetAudience?.ageMax || ''}
                            onChange={(e) => updateData({ targetAudience: { ...data.targetAudience, ageMax: e.target.value } })}
                        />
                    </div>
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor="targetInterests" className="block text-sm font-medium text-gray-700">Interests (comma separated)</label>
                    <input
                        id="targetInterests"
                        name="targetInterests"
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        placeholder="e.g. Shopify, E-commerce, Marketing"
                        value={data.targetAudience?.interests || ''}
                        onChange={(e) => updateData({ targetAudience: { ...data.targetAudience, interests: e.target.value } })}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        This will restrict your ad to people interested in these topics. Leave empty for broad targeting.
                    </p>
                </div>
            </div>
        </div>
    );
}
''''