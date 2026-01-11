import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function useCampaign(id: string) {
    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (!id) return;

        const fetchCampaign = async () => {
            try {
                const response = await api.getCampaign(id);
                setCampaign(response.data.campaign);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaign();
    }, [id]);

    return { campaign, loading, error };
}