''''use client';

interface Props {
    headline: string;
    primaryText: string;
    creativeUrl: string;
}

export default function MetaAdPreview({ headline, primaryText, creativeUrl }: Props) {
    return (
        <div className="bg-gray-100 p-4 rounded-lg">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-4">
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                        <div>
                            <p className="font-bold">Your Page</p>
                            <p className="text-xs text-gray-500">Sponsored</p>
                        </div>
                    </div>
                    <p className="mb-4">{primaryText}</p>
                </div>
                {creativeUrl && <img src={creativeUrl} alt="Ad Creative" className="w-full" />}
                <div className="p-4 bg-gray-50">
                    <p className="text-xs text-gray-500 uppercase">yourwebsite.com</p>
                    <p className="font-bold">{headline}</p>
                </div>
                <div className="p-2 text-center text-sm text-gray-500 border-t">
                    Like
                </div>
            </div>
        </div>
    );
}
''''