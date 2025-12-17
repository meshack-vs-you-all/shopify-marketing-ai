'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { ArrowUpTrayIcon, DocumentPlusIcon, UsersIcon } from '@heroicons/react/24/outline';

interface EmailList {
    id: string;
    name: string;
    description?: string;
    _count?: {
        subscribers: number;
    };
}

export default function ListsPage() {
    const [lists, setLists] = useState<EmailList[]>([]);
    const [loading, setLoading] = useState(true);
    const [showImport, setShowImport] = useState<string | null>(null); // listId to import to
    const { register, handleSubmit, reset } = useForm();

    useEffect(() => {
        loadLists();
    }, []);

    const loadLists = async () => {
        try {
            setLoading(true);
            const res = await api.getLists();
            setLists(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const createList = async (data: any) => {
        try {
            await api.createList(data);
            reset();
            loadLists();
        } catch (err) {
            alert('Failed to create list');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>, listId: string) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            const file = e.target.files[0];
            await api.importSubscribers(listId, file);
            alert('Import successful');
            setShowImport(null);
            loadLists();
        } catch (err) {
            alert('Failed to import subscribers');
        }
    };

    const handleDelete = async (listId: string, listName: string) => {
        if (!confirm(`Are you sure you want to delete "${listName}"? This will also delete all subscribers in this list.`)) {
            return;
        }
        try {
            await api.deleteList(listId);
            loadLists();
        } catch (err) {
            alert('Failed to delete list');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Audience Lists</h1>

            {/* Create List Form */}
            <div className="bg-white shadow sm:rounded-lg border border-cream-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New List</h3>
                <form onSubmit={handleSubmit(createList)} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">List Name</label>
                        <input
                            {...register('name', { required: true })}
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                            placeholder="e.g. Newsletter Subscribers"
                        />
                    </div>
                    <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        Create List
                    </button>
                </form>
            </div>

            {/* Lists Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {lists.map((list) => (
                    <div key={list.id} className="bg-white overflow-hidden shadow rounded-lg border border-cream-200 hover:shadow-md transition-shadow">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                                    <UsersIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dt className="text-sm font-medium text-gray-500 truncate">Subscribers</dt>
                                    <dd className="flex items-baseline">
                                        <div className="text-2xl font-semibold text-gray-900">
                                            {list._count?.subscribers || 0}
                                        </div>
                                    </dd>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h4 className="text-lg font-bold text-gray-900">{list.name}</h4>
                                <p className="mt-1 text-sm text-gray-500 truncate">{list.description || 'No description'}</p>
                            </div>

                            <div className="mt-6 space-y-2">
                                {showImport === list.id ? (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500">Select CSV File (email, firstName, lastName)</p>
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={(e) => handleImport(e, list.id)}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                        />
                                        <button
                                            onClick={() => setShowImport(null)}
                                            className="text-xs text-red-600 hover:text-red-800"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowImport(list.id)}
                                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <ArrowUpTrayIcon className="mr-2 h-4 w-4 text-gray-500" />
                                        Import CSV
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(list.id, list.name)}
                                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-200 shadow-sm text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50"
                                >
                                    Delete List
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {lists.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No lists found. Create one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
