import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh or logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// IG Accounts API functions
export const igAccountsApi = {
  getAll: () => api.get('/users/ig-accounts'),
  getById: (id: number) => api.get(`/users/ig-accounts/${id}`),
  create: (data: {
    name: string;
    description?: string;
    topics?: string;
    tone?: string;
  }) => api.post('/users/ig-accounts', data),
  update: (id: number, data: {
    name?: string;
    description?: string;
    topics?: string;
    tone?: string;
  }) => api.put(`/users/ig-accounts/${id}`, data),
  delete: (id: number) => api.delete(`/users/ig-accounts/${id}`),
};

// Content API functions
export const contentApi = {
  getAll: (filters?: {
    accountId?: number;
    type?: 'reel' | 'story' | 'post_with_image';
    status?: 'generated' | 'published' | 'rejected' | 'queued';
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return api.get(`/content?${params.toString()}`);
  },
  getById: (id: number) => api.get(`/content/${id}`),
  create: (data: {
    accountId: number;
    caption?: string;
    hashTags?: string[];
    generatedSource: string;
    usedTopics?: string;
    tone?: string;
    type?: 'reel' | 'story' | 'post_with_image';
    status?: 'generated' | 'published' | 'rejected' | 'queued';
  }) => api.post('/content', data),
  update: (id: number, data: {
    accountId?: number;
    caption?: string;
    hashTags?: string[];
    generatedSource?: string;
    usedTopics?: string;
    tone?: string;
    type?: 'reel' | 'story' | 'post_with_image';
    status?: 'generated' | 'published' | 'rejected' | 'queued';
  }) => api.put(`/content/${id}`, data),
  delete: (id: number) => api.delete(`/content/${id}`),
  
  // Media operations
  addMedia: (contentId: number, data: {
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    mediaType: 'image' | 'video';
  }) => api.post(`/content/${contentId}/media`, data),
  getMedia: (contentId: number) => api.get(`/content/${contentId}/media`),
  deleteMedia: (mediaId: number) => api.delete(`/content/media/${mediaId}`),
};

// Schedules API functions
export const schedulesApi = {
  getAll: (filters?: { 
    accountId?: number; 
    status?: 'active' | 'paused' | 'inactive'; 
    isEnabled?: boolean; 
    page?: number; 
    limit?: number; 
  }) => api.get('/schedules', { params: filters }),
  getById: (id: number) => api.get(`/schedules/${id}`),
  create: (data: {
    accountId: number;
    name: string;
    description?: string;
    frequency?: 'daily' | 'weekly' | 'custom';
    status?: 'active' | 'paused' | 'inactive';
    isEnabled?: boolean;
    startDate?: string;
    endDate?: string;
    customDays?: number[];
    timezone?: string;
    timeSlots?: Array<{
      startTime: string;
      endTime: string;
      dayOfWeek: number;
      postType: 'post_with_image' | 'reel' | 'story';
      isEnabled?: boolean;
      label?: string;
    }>;
  }) => api.post('/schedules', data),
  update: (id: number, data: Record<string, any>) => api.put(`/schedules/${id}`, data),
  delete: (id: number) => api.delete(`/schedules/${id}`),
  toggleStatus: (id: number) => api.put(`/schedules/${id}/toggle`),
  getByAccount: (accountId: number) => api.get(`/schedules/account/${accountId}`),
};

// Schedule Content API functions
export const scheduleContentApi = {
  getAll: (filters?: {
    scheduleId?: number;
    contentId?: number;
    timeSlotId?: number;
    status?: 'queued' | 'scheduled' | 'published' | 'failed' | 'cancelled';
    scheduledDate?: string;
    scheduledDateFrom?: string;
    scheduledDateTo?: string;
    page?: number;
    limit?: number;
  }) => api.get('/schedule-content', { params: filters }),
  getById: (id: number) => api.get(`/schedule-content/${id}`),
  create: (data: {
    scheduleId: number;
    contentId: number;
    timeSlotId?: number;
    scheduledDate: string;
    scheduledTime?: string;
    status?: 'queued' | 'scheduled' | 'published' | 'failed' | 'cancelled';
    priority?: number;
    notes?: string;
  }) => api.post('/schedule-content', data),
  update: (id: number, data: {
    scheduledDate?: string;
    scheduledTime?: string;
    status?: 'queued' | 'scheduled' | 'published' | 'failed' | 'cancelled';
    priority?: number;
    notes?: string;
    failureReason?: string;
  }) => api.put(`/schedule-content/${id}`, data),
  delete: (id: number) => api.delete(`/schedule-content/${id}`),
  getBySchedule: (scheduleId: number) => api.get(`/schedule-content/schedule/${scheduleId}`),
  getQueue: (filters?: {
    scheduleId?: number;
    timeSlotId?: number;
    status?: 'pending' | 'ready' | 'processing' | 'completed' | 'failed';
    queueDate?: string;
    queueDateFrom?: string;
    queueDateTo?: string;
    page?: number;
    limit?: number;
  }) => api.get('/schedule-content/queue', { params: filters }),
};

// AI API functions
export const aiApi = {
  generateSchedule: (accountId: number) => api.get(`/ai/generate-schedule/${accountId}`),
  generateSchedulePost: (data: { accountId: number }) => api.post('/ai/generate-schedule', data),
  generateContent: (data: { scheduleId: number; generationWeek?: string }) => api.post('/ai/generate-content', data),
  getNextGeneratableWeek: (scheduleId: number) => api.get(`/ai/next-generatable-week/${scheduleId}`),
};

// Instagram API functions
export const instagramApi = {
  getAuthUrl: (accountId: number) => api.get(`/auth/instagram/auth-url/${accountId}`),
  getStatus: (accountId: number) => api.get(`/auth/instagram/status/${accountId}`),
  testConnection: (accountId: number) => api.post(`/auth/instagram/test/${accountId}`),
  disconnect: (accountId: number) => api.post(`/auth/instagram/disconnect/${accountId}`),
  postContent: (data: { contentId: number; accountId: number }) => api.post('/auth/instagram/post', data),
};

export default api;
