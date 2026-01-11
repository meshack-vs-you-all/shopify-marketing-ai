''''use client';

interface Props {
    htmlContent: string;
}

export default function EmailPreview({ htmlContent }: Props) {
    return (
        <div className="bg-gray-100 p-4 rounded-lg">
            <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b">
                    <p className="text-sm text-gray-500">Email Preview</p>
                </div>
                <div className="p-4">
                    <iframe
                        srcDoc={htmlContent}
                        className="w-full h-96 border-none"
                        title="Email Preview"
                    />
                </div>
            </div>
        </div>
    );
}
''''