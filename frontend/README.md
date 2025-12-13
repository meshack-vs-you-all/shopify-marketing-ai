# Glowify Marketing AI - Frontend

Next.js 14 frontend dashboard for Shopify Marketing Automation AI system.

## Features

- ✅ Authentication with API key
- ✅ Campaign management (list, create, view, deploy)
- ✅ Performance analytics with charts
- ✅ Approval workflow management
- ✅ Real-time metrics display
- ✅ Responsive design
- ✅ Luxury brand aesthetic

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Backend API running on `http://localhost:5000`

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API URL and key

# Run development server
npm run dev
```

Visit `http://localhost:3000`

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_API_KEY=your-api-key-here
```

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── campaigns/    # Campaign pages
│   │   ├── approvals/    # Approval pages
│   │   ├── analytics/    # Analytics dashboard
│   │   └── login/        # Login page
│   ├── components/       # React components
│   │   ├── AuthProvider.tsx
│   │   ├── Layout.tsx
│   │   └── ProtectedRoute.tsx
│   └── lib/              # Utilities
│       └── api.ts        # API client
├── public/               # Static assets
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

## Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## Features

### Authentication
- API key-based authentication
- Secure localStorage storage
- Automatic token refresh
- Protected routes

### Campaign Management
- List all campaigns with filters
- Create new campaigns
- View campaign details
- Deploy campaigns
- Optimize campaigns

### Analytics
- Performance metrics dashboard
- Interactive charts (Recharts)
- Platform comparison
- Top performing campaigns

### Approvals
- View pending approvals
- Approve/reject requests
- Approval history

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

