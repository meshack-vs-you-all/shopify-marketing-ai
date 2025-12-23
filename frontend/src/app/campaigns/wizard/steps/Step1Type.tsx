'use client';
import { WizardData } from '../page';

interface Props {
    data: WizardData;
    updateData: (data: Partial<WizardData>) => void;
}

export default function Step1Type({ data, updateData }: Props) {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-6">Select Campaign Type</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Newsletter Option */}
                <div
                    onClick={() => updateData({ type: 'NEWSLETTER' })}
                    className={`cursor-pointer border-2 rounded-lg p-6 transition-all ${data.type === 'NEWSLETTER' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                >
                    <div className="flex items-center mb-4">
                        <span className="text-2xl mr-3">📧</span>
                        <h3 className="text-lg font-medium">Email Newsletter</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                        Send rich HTML emails to your audience lists. Great for announcements, newsletters, and promotions.
                    </p>
                </div>

                {/* Meta Ad Option */}
                <div
                    onClick={() => updateData({ type: 'META_AD' })}
                    className={`cursor-pointer border-2 rounded-lg p-6 transition-all ${data.type === 'META_AD' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                >
                    <div className="flex items-center mb-4">
                        <span className="text-2xl mr-3">📢</span>
                        <h3 className="text-lg font-medium">Meta Ad</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                        Create Facebook and Instagram ads. Prepare copy, creative, and targeting parameters for export or API integration.
                    </p>
                </div>
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
