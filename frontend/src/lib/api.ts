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
  // Auth
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: any) => apiClient.post('/auth/login', data),

  // Health check (no auth required)
  health: () => apiClient.get('/health'),

  // Email Marketing
  getLists: () => apiClient.get('/api/email-campaigns/lists'),
  createList: (data: any) => apiClient.post('/api/email-campaigns/lists', data),
  deleteList: (listId: string) => apiClient.delete(`/api/email-campaigns/lists/${listId}`),
  getSubscribers: (listId: string) => apiClient.get(`/api/email-campaigns/lists/${listId}/subscribers`),
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
