import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth - dynamically get API key
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear auth tokens and redirect
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // Auth
  register: (data: any) => apiClient.post('/api/auth/register', data),
  login: (data: any) => apiClient.post('/api/auth/login', data),

  // Health check (no auth required)
  health: () => apiClient.get('/health'),

  // Email Marketing
  getLists: () => apiClient.get('/api/email-campaigns/lists'),
  createList: (data: any) => apiClient.post('/api/email-campaigns/lists', data),
  deleteList: (listId: string) => apiClient.delete(`/api/email-campaigns/lists/${listId}`),
  getSubscribers: (listId: string) => apiClient.get(`/api/email-campaigns/lists/${listId}/subscribers`),
  addSubscriber: (listId: string, data: any) => apiClient.post(`/api/email-campaigns/lists/${listId}/subscribers`, data),
  importSubscribers: (listId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/api/email-campaigns/lists/${listId}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getEmailCampaigns: () => apiClient.get('/api/email-campaigns'),
  createEmailCampaign: (data: any) => apiClient.post('/api/email-campaigns', data),
  sendEmailCampaign: (id: string) => apiClient.post(`/api/email-campaigns/${id}/send`),
  getDashboardStats: () => apiClient.get('/api/email-campaigns/dashboard-stats'),
  generateEmailContent: (data: any) => apiClient.post('/api/email-campaigns/generate', data),
  generateAdCopy: (data: any) => apiClient.post('/api/email-campaigns/generate-ad-copy', data),
  generateProductDescription: (data: any) => apiClient.post('/api/email-campaigns/generate-product-description', data),
  generateImage: (data: any) => apiClient.post('/api/email-campaigns/generate-image', data),

  getCampaigns: (params?: { platform?: string; status?: string; limit?: number; offset?: number }) =>
    apiClient.get('/api/campaigns', { params }),

  getCampaign: (id: string) =>
    apiClient.get(`/api/campaigns/${id}`),

  createCampaign: (data: any) =>
    apiClient.post('/api/campaigns', data),

  getCampaignMetrics: (id: string) =>
    apiClient.get(`/api/campaigns/${id}/metrics`),

  optimizeCampaign: (id: string) =>
    apiClient.post(`/api/campaigns/${id}/optimize`),

  deployCampaign: (id: string) =>
    apiClient.post(`/api/campaigns/${id}/deploy`),

  updateCampaign: (id: string, data: any) =>
    apiClient.patch(`/api/campaigns/${id}`, data),

  deleteCampaign: (id: string) =>
    apiClient.delete(`/api/campaigns/${id}`),

  // Approvals
  getApprovals: () =>
    apiClient.get('/api/approvals'),

  approveRequest: (id: string, data: { approvedBy: string }) =>
    apiClient.post(`/api/approvals/${id}/approve`, data),

  rejectRequest: (id: string, data: { rejectedBy: string; reason: string }) =>
    apiClient.post(`/api/approvals/${id}/reject`, data),

  // Campaign Wizard
  createCampaignDraft: (data: { type: string; name: string }) => apiClient.post('/api/campaigns/wizard/draft', data),
  getCampaignWizardData: (id: string) => apiClient.get(`/api/campaigns/wizard/${id}`),
  updateCampaignAudience: (id: string, data: any) => apiClient.put(`/api/campaigns/wizard/${id}/audience`, data),
  updateCampaignContent: (id: string, data: any) => apiClient.put(`/api/campaigns/wizard/${id}/content`, data),
  finalizeCampaign: (id: string) => apiClient.post(`/api/campaigns/wizard/${id}/finalize`),
  sendCampaignWizard: (id: string) => apiClient.post(`/api/campaigns/wizard/${id}/send`),

  // Settings
  getIntegrationStatus: () => apiClient.get('/api/settings/integrations'),
  getSystemStatus: () => apiClient.get('/api/settings/system'),

  // AI - Models & Discovery
  getAIModels: () => apiClient.get('/api/ai/models'),
  getAIModelRecommendations: (taskType: string, budget?: number) =>
    apiClient.get(`/api/ai/models/recommended/${taskType}`, { params: { budget } }),

  // AI - Settings
  getAISettings: () => apiClient.get('/api/ai/settings'),
  updateAISettings: (data: {
    defaultModel?: string;
    defaultTemperature?: number;
    defaultMaxTokens?: number;
    dailyBudgetLimit?: number;
    monthlyBudgetLimit?: number;
    perRequestLimit?: number;
    taskOverrides?: Record<string, any>;
    enabledModels?: string[];
    enableFallbacks?: boolean;
    enableCostTracking?: boolean;
  }) => apiClient.put('/api/ai/settings', data),

  // AI - Usage & Budget
  getAIUsage: () => apiClient.get('/api/ai/usage'),

  // AI - Generation (new unified endpoint)
  generateContent: (data: {
    taskType: string;
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
  }) => apiClient.post('/api/ai/generate', data),

  // AI - Health
  getAIHealth: () => apiClient.get('/api/ai/health'),

  // AI - Newsletter Generation (single-action complete newsletter)
  generateNewsletter: (data: {
    campaignType: 'newsletter' | 'promotion' | 'product_launch' | 'seasonal';
    campaignName?: string;
    productIds?: string[];
    products?: Array<{ id: string; title: string; description: string; price: string; imageUrl?: string }>;
    tone?: 'professional' | 'casual' | 'friendly' | 'urgent' | 'luxury';
    seoOptimized?: boolean;
    includeHeroImage?: boolean;
    customInstructions?: string;
    model?: string;
  }) => apiClient.post('/api/ai/generate/newsletter', data),

  // Shopify - Products & Collections
  getShopifyProducts: (limit?: number) => apiClient.get('/api/shopify/products', { params: { limit } }),
  getShopifyProduct: (id: string) => apiClient.get(`/api/shopify/products/${id}`),
  getShopifyCollections: () => apiClient.get('/api/shopify/collections'),
  getShopifyAnalytics: () => apiClient.get('/api/shopify/analytics'),
  getShopifyStatus: () => apiClient.get('/api/shopify/status'),

  // Meta Publishing
  getMetaAccounts: () => apiClient.get('/api/meta/accounts'),
  syncMetaAccounts: (accessToken?: string) => apiClient.post('/api/meta/accounts/sync', { access_token: accessToken }),
  getMetaStatus: () => apiClient.get('/api/meta/status'),
  validateMetaScopes: (target: 'instagram' | 'facebook') => apiClient.get('/api/meta/validate-scopes', { params: { target } }),
  createMetaPost: (data: {
    target: 'instagram' | 'facebook' | 'whatsapp';
    account_id: string;
    media: string[];
    caption: string;
    schedule_at?: string | null;
    campaign_id?: string;
    idempotency_key?: string;
    ai_generate?: {
      product_info?: { name: string; description: string; price?: number };
      tone?: 'professional' | 'casual' | 'playful' | 'luxury' | 'friendly';
      length?: 'short' | 'medium' | 'long';
    };
  }) => apiClient.post('/api/meta/post', data),
  generateMetaCaptions: (data: {
    prompt_hints?: string;
    product_info?: { name: string; description: string; price?: number };
    tone?: 'professional' | 'casual' | 'playful' | 'luxury' | 'friendly';
    length?: 'short' | 'medium' | 'long';
    include_hashtags?: boolean;
    platform?: 'instagram' | 'facebook';
    creative?: boolean;
  }) => apiClient.post('/api/meta/generate-captions', data),
  testMetaPublish: (data: { target?: string; account_id?: string; media?: string[]; caption?: string }) =>
    apiClient.post('/api/meta/test-publish', data),
};

export default apiClient;
