''''use client';
import { useParams } from 'next/navigation';
import { useCampaign } from '@/hooks/useCampaign';

export default function CampaignDetailPage() {
    const { id } = useParams();
    const { campaign, loading, error } = useCampaign(id as string);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error loading campaign.</div>;
    if (!campaign) return <div>Campaign not found.</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <p>{campaign.description}</p>
        </div>
    );
}
''''