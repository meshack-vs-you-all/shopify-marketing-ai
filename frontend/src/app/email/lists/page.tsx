'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import {
    ArrowUpTrayIcon,
    UsersIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon,
    UserPlusIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { HelpTooltip } from '@/components/HelpTooltip';

interface EmailList {
    id: string;
    name: string;
    description?: string;
    _count?: {
        subscribers: number;
    };
}

interface Subscriber {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    status: string;
    createdAt: string;
}

export default function ListsPage() {
    const [lists, setLists] = useState<EmailList[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedList, setSelectedList] = useState<EmailList | null>(null);
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [subsLoading, setSubsLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddSubModal, setShowAddSubModal] = useState(false);
    const [importing, setImporting] = useState(false);

    const { register: registerList, handleSubmit: handleListSubmit, reset: resetList } = useForm();
    const { register: registerSub, handleSubmit: handleSubSubmit, reset: resetSub } = useForm();

    useEffect(() => {
        loadLists();
    }, []);

    useEffect(() => {
        if (selectedList) {
            loadSubscribers(selectedList.id);
        }
    }, [selectedList]);

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

    const loadSubscribers = async (listId: string) => {
        try {
            setSubsLoading(true);
            const res = await api.getSubscribers(listId);
            setSubscribers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setSubsLoading(false);
        }
    };

    const createList = async (data: any) => {
        try {
            await api.createList(data);
            resetList();
            setShowCreateModal(false);
            loadLists();
        } catch (err) {
            console.error('Failed to create list', err);
        }
    };

    const addSubscriber = async (data: any) => {
        if (!selectedList) return;
        try {
            await api.addSubscriber(selectedList.id, data);

            resetSub();
            setShowAddSubModal(false);
            loadSubscribers(selectedList.id);
            loadLists(); // Update counts
        } catch (err) {
            alert('Failed to add subscriber');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>, listId: string) => {
        if (!e.target.files || e.target.files.length === 0) return;
        try {
            setImporting(true);
            const file = e.target.files[0];
            await api.importSubscribers(listId, file);
            alert('Import successful');
            loadSubscribers(listId);
            loadLists();
        } catch (err) {
            alert('Failed to import subscribers');
        } finally {
            setImporting(false);
        }
    };

    const handleDeleteList = async (listId: string) => {
        if (!confirm('Are you sure? All subscribers in this list will be removed.')) return;
        try {
            await api.deleteList(listId);
            if (selectedList?.id === listId) setSelectedList(null);
            loadLists();
        } catch (err) {
            alert('Failed to delete list');
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audience Lists</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your email subscribers and segments.</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" />
                    New List
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                {/* Lists Sidebar */}
                <div className="lg:col-span-4 space-y-4">
                    {lists.map((list) => (
                        <div
                            key={list.id}
                            onClick={() => setSelectedList(list)}
                            className={`
                                cursor-pointer p-4 rounded-xl border transition-all
                                ${selectedList?.id === list.id
                                    ? 'bg-primary-50 border-primary-200 shadow-md ring-1 ring-primary-200 dark:bg-primary-900/20 dark:border-primary-700'
                                    : 'bg-white border-gray-200 hover:border-primary-200 hover:shadow-sm dark:bg-gray-800 dark:border-gray-700'}
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className={`font-semibold ${selectedList?.id === list.id ? 'text-primary-800 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
                                        {list.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                        {list.description || 'No description'}
                                    </p>
                                </div>
                                <div className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md flex items-center gap-1">
                                    <UsersIcon className="w-3 h-3 text-gray-500" />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{list._count?.subscribers || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {lists.length === 0 && !loading && (
                        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <p className="text-gray-500 text-sm">No lists yet.</p>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-8">
                    {selectedList ? (
                        <Card className="h-full flex flex-col min-h-[500px]">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedList.name}</h2>
                                    <p className="text-sm text-gray-500">
                                        {selectedList._count?.subscribers || 0} subscribers
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id={`csv-${selectedList.id}`}
                                            accept=".csv"
                                            className="hidden"
                                            onChange={(e) => handleImport(e, selectedList.id)}
                                            disabled={importing}
                                        />
                                        <label
                                            htmlFor={`csv-${selectedList.id}`}
                                            className={`
                                                cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50
                                                ${importing ? 'opacity-50 cursor-not-allowed' : ''}
                                            `}
                                        >
                                            <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                                            {importing ? 'Importing...' : 'Import CSV'}
                                        </label>
                                    </div>
                                    <Button variant="outline" onClick={() => setShowAddSubModal(true)}>
                                        <UserPlusIcon className="w-4 h-4 mr-2" />
                                        Add Manually
                                    </Button>
                                    <button
                                        onClick={() => handleDeleteList(selectedList.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                                        title="Delete List"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Subscribers Table */}
                            <div className="flex-1 overflow-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                        {subscribers.map((sub) => (
                                            <tr key={sub.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    {sub.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {sub.firstName} {sub.lastName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sub.status === 'SUBSCRIBED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {sub.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(sub.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {subscribers.length === 0 && !subsLoading && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                    No subscribers yet. Add some manually or import a CSV.
                                                </td>
                                            </tr>
                                        )}
                                        {subsLoading && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                    Loading...
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
                            <div className="text-center">
                                <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Select a list to view details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create List Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Create New List</h3>
                            <button onClick={() => setShowCreateModal(false)}><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleListSubmit(createList)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">List Name</label>
                                <input {...registerList('name', { required: true })} className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 p-2 border" placeholder="e.g. Weekly Newsletter" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label>
                                <textarea {...registerList('description')} className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 p-2 border" placeholder="Optional description" />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                                <Button type="submit">Create List</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Subscriber Modal */}
            {showAddSubModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Add Subscriber</h3>
                            <button onClick={() => setShowAddSubModal(false)}><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleSubSubmit(addSubscriber)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email *</label>
                                <input {...registerSub('email', { required: true })} type="email" className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 p-2 border" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">First Name</label>
                                    <input {...registerSub('firstName')} className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 p-2 border" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Last Name</label>
                                    <input {...registerSub('lastName')} className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 p-2 border" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" type="button" onClick={() => setShowAddSubModal(false)}>Cancel</Button>
                                <Button type="submit">Add Subscriber</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
