'use client';
import { useEffect, useState } from 'react';
import { WizardData } from '../page';
import { api } from '@/lib/api';

interface Props {
    data: WizardData;
    updateData: (data: Partial<WizardData>) => void;
}

export default function Step2Audience({ data, updateData }: Props) {
    const [lists, setLists] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (data.type === 'NEWSLETTER') {
            loadLists();
        }
    }, [data.type]);

    const loadLists = async () => {
        setLoading(true);
        try {
            const res = await api.getLists();
            setLists(res.data);
        } catch (err) {
            console.error('Failed to load lists', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-6">Audience Selection</h2>

            {data.type === 'NEWSLETTER' ? (
                <div>
                    <p className="mb-4 text-gray-600">Select an email list to send this campaign to.</p>
                    {loading ? (
                        <p>Loading lists...</p>
                    ) : (
                        <div className="space-y-4">
                            {lists.map(list => (
                                <div
                                    key={list.id}
                                    onClick={() => updateData({ emailListId: list.id })}
                                    className={`p-4 border rounded-lg cursor-pointer flex justify-between items-center ${data.emailListId === list.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div>
                                        <h3 className="font-medium text-gray-900">{list.name}</h3>
                                        <p className="text-sm text-gray-500">{list.subscribers?.length || 0} Subscribers</p>
                                    </div>
                                    {data.emailListId === list.id && (
                                        <span className="text-indigo-600 font-bold">Selected</span>
                                    )}
                                </div>
                            ))}
                            {lists.length === 0 && (
                                <p className="text-red-500">No lists found. Please create a list in Audience Manager first.</p>
                            )}
                        </div>
                    )}
                </div>
            ) : (
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
