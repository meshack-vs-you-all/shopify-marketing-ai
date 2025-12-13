import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
});

// Request interceptor for auth
apiClient.interceptors.request.use(
  (config) => {
    // Add API key to all requests
    if (API_KEY) {
      config.headers['x-api-key'] = API_KEY;
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
      // Handle unauthorized - redirect to login or show error
      console.error('Unauthorized - check API key');
    }
    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // Health check
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

