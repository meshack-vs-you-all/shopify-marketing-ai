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
    // Get API key from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const apiKey = localStorage.getItem('api_key');
      if (apiKey) {
        config.headers['x-api-key'] = apiKey;
      }
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
      // Handle unauthorized - clear API key and redirect
      if (typeof window !== 'undefined') {
        localStorage.removeItem('api_key');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // Health check (no auth required)
  health: () => apiClient.get('/health'),

  // Campaigns
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

  // Approvals
  getApprovals: () =>
    apiClient.get('/api/approvals'),
  
  approveRequest: (id: string, data: { approvedBy: string }) =>
    apiClient.post(`/api/approvals/${id}/approve`, data),
  
  rejectRequest: (id: string, data: { rejectedBy: string; reason: string }) =>
    apiClient.post(`/api/approvals/${id}/reject`, data),
};

export default apiClient;
