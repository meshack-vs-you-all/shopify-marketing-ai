# Implementation Plan: Public SEO Blog Integration

**Status**: Locked & Ready for Execution
**Target**: `marketing.glowifybabystores.com` (Monorepo: Next.js + Express)
**Goal**: Launch public SEO blog at `/blog` without disrupting existing services.

---

## 1. Locked Architecture
*   **Routing**: Path-based (`/blog`, `/blog/[slug]`) within the existing Next.js frontend.
*   **Data Flow**: Next.js Server Components -> Express Backend API (via internal Docker network) -> Postgres/Shopify.
*   **Caching**: Next.js ISR (Revalidate: 3600s) to offload Backend/DB.
*   **Auth**: Public read access to blog; Admin-only write access via existing Dashboard.

---

## 2. Detailed Implementation Steps

### Phase 1: Database & Backend Core (Day 1)

#### 1.1 Prisma Schema Updates
Add the following models to `backend/prisma/schema.prisma`:
```prisma
model BlogPost {
  id          String      @id @default(cuid())
  title       String
  slug        String      @unique
  excerpt     String?     @db.Text
  content     String      @db.Text // Markdown or HTML
  coverImage  String?
  published   Boolean     @default(false)
  publishedAt DateTime?
  authorId    String
  author      User        @relation(fields: [authorId], references: [id])
  
  // SEO Metadata
  seoTitle    String?
  seoDesc     String?
  keywords    String[]

  // Shopify Integration
  featuredProductId String? // Stores Shopify Product ID or Handle

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  @@index([published, publishedAt])
  @@map("blog_posts")
}
```

#### 1.2 Backend API Routes (`backend/src/api/blog.routes.ts`)
*   **Public Endpoints** (No Auth Middleware):
    *   `GET /` (List published posts, paginated)
    *   `GET /:slug` (Get single post details)
*   **Protected Endpoints** (With `authenticate` Middleware):
    *   `POST /` (Create draft)
    *   `PUT /:id` (Update post)
    *   `DELETE /:id` (Delete post)

#### 1.3 Register Routes
Update `backend/src/api/routes.ts`:
```typescript
import blogRoutes from './blog.routes';
// ...
router.use('/blog', blogRoutes); // Middleware inside blogRoutes handles public vs protected
```

### Phase 2: Frontend Implementation (Day 2-3)

#### 2.1 Route Structure (`frontend/src/app/blog`)
Create the following file structure:
```text
src/app/blog/
├── page.tsx           # Blog Index (ISR)
├── [slug]/
│   └── page.tsx       # Single Post (ISR)
└── layout.tsx         # Blog-specific layout (Header/Footer)
```

#### 2.2 Middleware & Layout Protection
Update `frontend/src/components/Layout.tsx` to exempt `/blog`:
```typescript
const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/blog');
```

#### 2.3 Data Fetching (ISR)
In `src/app/blog/page.tsx`:
```typescript
export const revalidate = 3600; // Revalidate every hour

async function getPosts() {
  const res = await fetch(`${process.env.INTERNAL_API_URL}/api/blog?published=true`, {
    next: { revalidate: 3600 }
  });
  return res.json();
}
```

### Phase 3: Shopify Integration (Day 4)

#### 3.1 Product Card Component
Create `src/components/blog/ShopifyProductCard.tsx`.
*   **Input**: `productId` or `handle`.
*   **Fetching**:
    *   **Option A (Server-side)**: Fetch product data in `page.tsx` during build via Backend API -> ShopifyService. Pass data to component. **(Recommended)**
    *   **Option B (Client-side)**: Fetch on mount. (Avoid - bad for SEO/CLS).

#### 3.2 Backend Service Update
Ensure `ShopifyService` has a method `getProductByHandle(handle: string)` that handles caching internally if possible, though Next.js ISR will handle the primary layer of caching.

### Phase 4: SEO & Performance (Day 5)

#### 4.1 Metadata
In `src/app/blog/[slug]/page.tsx`:
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug);
  return {
    title: post.seoTitle || post.title,
    description: post.seoDesc || post.excerpt,
    openGraph: { images: [post.coverImage] }
  };
}
```

#### 4.2 Sitemap
Create `src/app/sitemap.ts`:
*   Fetch all published blog slugs.
*   Generate XML entries including `/blog` index.

#### 4.3 Robots
Create `src/app/robots.ts`:
*   Allow `/blog/*`.
*   Disallow `/dashboard/*` (if not already handled).

### Phase 5: Testing & Rollout (Day 6)

#### 5.1 Safety Checks
*   **Rate Limits**: Ensure `GET /api/blog/*` is exempted from the strict 100 req/15min limit in `backend` if necessary, OR rely on Next.js ISR (which means the API is only hit once/hour regardless of traffic). **Plan: Rely on ISR.**

#### 5.2 Deployment
*   Atomic commit to `main`.
*   Railway auto-deploy.
*   Verify `marketing.glowifybabystores.com/blog`.

---

## 3. Execution Checklist

- [ ] **DB**: Update Prisma Schema & Run Migrations
- [ ] **Backend**: Create Blog Controller & Routes
- [ ] **Frontend**: Update `Layout.tsx` to unblock `/blog`
- [ ] **Frontend**: Build Blog Index Page (`/blog`) with ISR
- [ ] **Frontend**: Build Blog Post Page (`/blog/[slug]`) with ISR
- [ ] **Frontend**: Implement `generateMetadata` & `sitemap.ts`
- [ ] **Verification**: Test public access vs admin editing
- [ ] **Launch**: Deploy to Production

---

## 4. Time Estimates
*   **Schema & Backend**: 4 Hours
*   **Frontend Core**: 6 Hours
*   **Shopify Integration**: 3 Hours
*   **SEO & Polish**: 3 Hours
*   **Testing**: 2 Hours
*   **Total**: ~18 Hours (2-3 Days)

**Risk Assessment**: **Low**. The "Same App" approach leverages the existing robust platform. ISR completely negates performance risks to the backend.
