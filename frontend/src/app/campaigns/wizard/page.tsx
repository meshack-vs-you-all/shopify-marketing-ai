'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Step1Type from './steps/Step1Type';
import Step2Audience from './steps/Step2Audience';
import Step3Content from './steps/Step3Content';
import Step4Preview from './steps/Step4Preview';

export type WizardData = {
    id?: string; // Draft ID from backend
    type: 'NEWSLETTER' | 'META_AD';
    name: string;
    emailListId?: string;
    targetAudience?: any;
    // Content
    subject?: string;
    htmlContent?: string;
    headline?: string;
    primaryText?: string;
    description?: string;
    creativeUrl?: string;
};

const steps = [
    { id: 1, name: 'Campaign Type' },
    { id: 2, name: 'Audience' },
    { id: 3, name: 'Content' },
    { id: 4, name: 'Preview & Launch' },
];

export default function CampaignWizardPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [data, setData] = useState<WizardData>({
        type: 'NEWSLETTER',
        name: '',
    });

    // Helper to sync draft with backend
    const syncDraft = async (newData: Partial<WizardData>) => {
        const updated = { ...data, ...newData };
        setData(updated);
    };

    const nextStep = async () => {
        setLoading(true);
        try {
            if (currentStep === 1) {
                // Create draft if not exists
                if (!data.id) {
                    const res = await api.createCampaignDraft({ type: data.type, name: data.name || 'Untitled Campaign' });
                    setData(prev => ({ ...prev, id: res.data.id, name: res.data.name }));
                }
            } else if (currentStep === 2) {
                // Save Audience
                if (data.id) {
                    await api.updateCampaignAudience(data.id, {
                        emailListId: data.emailListId,
                        targetAudience: data.targetAudience
                    });
                }
            } else if (currentStep === 3) {
                // Save Content
                if (data.id) {
                    await api.updateCampaignContent(data.id, {
                        // Newsletter
                        subject: data.subject,
                        htmlContent: data.htmlContent,
                        // Meta
                        headline: data.headline,
                        primaryText: data.primaryText,
                        description: data.description,
                        creativeUrl: data.creativeUrl
                    });
                }
            }

            setCurrentStep(prev => prev + 1);
        } catch (err) {
            console.error('Failed to save draft', err);
        } finally {
            setLoading(false);
        }
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Step Indicator */}
            <nav aria-label="Progress">
                <ol role="list" className="flex items-center">
                    {steps.map((step, stepIdx) => (
                        <li key={step.name} className={`${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                            {step.id < currentStep ? (
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="h-0.5 w-full bg-indigo-600" />
                                </div>
                            ) : null}
                            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-indigo-600">
                                {step.id < currentStep ? (
                                    <span className="text-indigo-600 font-bold">✓</span>
                                ) : step.id === currentStep ? (
                                    <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                                ) : (
                                    <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                                )}
                            </div>
                            <p className={`mt-2 text-sm font-medium ${step.id === currentStep ? 'text-indigo-600' : 'text-gray-500'}`}>{step.name}</p>
                        </li>
                    ))}
                </ol>
            </nav>

            {/* Content */}
            <div className="mt-8 bg-white shadow rounded-lg p-6 min-h-[400px]">
                {currentStep === 1 && <Step1Type data={data} updateData={syncDraft} />}
                {currentStep === 2 && <Step2Audience data={data} updateData={syncDraft} />}
                {currentStep === 3 && <Step3Content data={data} updateData={syncDraft} />}
                {currentStep === 4 && <Step4Preview data={data} />}
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-between">
                <button
                    onClick={prevStep}
                    disabled={currentStep === 1 || loading}
                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                    Back
                </button>

                {currentStep < 4 ? (
                    <button
                        onClick={nextStep}
                        disabled={loading}
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Next'}
                    </button>
                ) : (
                    <button
                        onClick={async () => {
                            setLoading(true);
                            try {
                                if (!data.id) return;
                                if (data.type === 'NEWSLETTER') {
                                    // Send/Queue
                                    await api.sendCampaignWizard(data.id);
                                    router.push('/email/dashboard'); // Or new unified dashboard
                                } else {
                                    // Finalize Meta
                                    await api.finalizeCampaign(data.id);
                                    router.push('/campaigns'); // Or new unified Campaigns list
                                }
                            } catch (e) {
                                console.error(e);
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (data.type === 'NEWSLETTER' ? 'Send Campaign' : 'Finish & Export')}
                    </button>
                )}
            </div>
        </div>
    );
}
