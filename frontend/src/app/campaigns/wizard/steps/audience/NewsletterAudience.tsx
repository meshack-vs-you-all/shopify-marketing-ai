''''use client';
import { useEffect, useState } from 'react';
import { WizardData } from '@/hooks/useCampaignWizard';
import { api } from '@/lib/api';

interface Props {
    data: WizardData;
    updateData: (data: Partial<WizardData>) => void;
}

export default function NewsletterAudience({ data, updateData }: Props) {
    const [lists, setLists] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadLists();
    }, []);

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
            <p className="mb-4 text-gray-600">Select an email list to send this campaign to.</p>
            {loading ? (
                <p>Loading lists...</p>
            ) : (
                <div className="space-y-4">
                    {lists.map(list => (
                        <div
                            key={list.id}
                            onClick={() => updateData({ emailListId: list.id })}
                            className={`p-4 border rounded-lg cursor-pointer flex justify-between items-center ${data.emailListId === list.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
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
                        <div className="text-center py-6 bg-gray-50 rounded-lg">
                            <p className="text-gray-600 mb-4">No email lists found.</p>
                            <a href="/email/lists/new" target="_blank" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
                                Create New List
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
''''