import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Glowify Marketing AI
        </h1>
        <p className="text-center text-gray-600 mb-8">
          AI-powered marketing automation for baby products
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/campaigns"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            View Campaigns
          </Link>
          <Link
            href="/campaigns/new"
            className="px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition"
          >
            Create Campaign
          </Link>
        </div>
      </div>
    </main>
  );
}

