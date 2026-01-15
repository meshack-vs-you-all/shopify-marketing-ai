import GoogleSignInButton from "../../components/GoogleSignInButton";

export default function TestAuthPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                <h1 className="text-2xl font-bold mb-2 text-gray-900">Sign In Test</h1>
                <p className="text-gray-600 mb-8">
                    Click below to initiate the Google OAuth flow via NextAuth + Backend.
                </p>

                <GoogleSignInButton />

                <div className="mt-8 text-sm text-gray-500 text-left">
                    <p className="font-semibold mb-1">Prerequisites:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>env: GOOGLE_CLIENT_ID set</li>
                        <li>env: GOOGLE_CLIENT_SECRET set</li>
                        <li>env: NEXTAUTH_URL set</li>
                        <li>Backend running (for callbacks)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
