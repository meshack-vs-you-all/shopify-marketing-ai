''''use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export interface TargetAudience {
    location?: string;
    ageMin?: string;
    ageMax?: string;
    interests?: string;
}

export type WizardData = {
    id?: string;
    type: 'NEWSLETTER' | 'META_AD';
    name: string;
    emailListId?: string;
    targetAudience?: TargetAudience;
    subject?: string;
    htmlContent?: string;
    headline?: string;
    primaryText?: string;
    description?: string;
    creativeUrl?: string;
};

export function useCampaignWizard() {
    const router = useRouter();
    const [data, setData] = useState<WizardData>({ type: 'NEWSLETTER', name: '' });
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateData = (newData: Partial<WizardData>) => {
        setData(prev => ({ ...prev, ...newData }));
        setError(null);
    };

    const saveDraft = async (step: number) => {
        setLoading(true);
        setError(null);
        try {
            let res;
            if (step === 1 && !data.id) {
                res = await api.createCampaignDraft({ type: data.type, name: data.name || 'Untitled Campaign' });
                setData(prev => ({ ...prev, id: res.data.id, name: res.data.name }));
            } else if (step === 2 && data.id) {
                await api.updateCampaignAudience(data.id, { emailListId: data.emailListId, targetAudience: data.targetAudience });
            } else if (step === 3 && data.id) {
                await api.updateCampaignContent(data.id, { subject: data.subject, htmlContent: data.htmlContent, headline: data.headline, primaryText: data.primaryText, description: data.description, creativeUrl: data.creativeUrl });
            }
            return true;
        } catch (err: any) {
            const message = err.response?.data?.error || err.message || 'Failed to save draft';
            setError(message);
            console.error(err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const nextStep = async () => {
        const success = await saveDraft(currentStep);
        if (success) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    const finalize = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!data.id) return;
            if (data.type === 'NEWSLETTER') {
                await api.sendCampaignWizard(data.id);
                router.push('/email/dashboard');
            } else {
                const res = await api.finalizeCampaign(data.id);
                router.push(`/campaigns/${res.data.id}`);
            }
        } catch (err: any) {
            const message = err.response?.data?.error || err.message || 'An unexpected error occurred';
            setError(message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return { data, currentStep, loading, error, updateData, nextStep, prevStep, finalize };
}
''''