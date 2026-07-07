import axios from 'axios';
import type { 
  Family, 
  Child, 
  Payment, 
  BalanceHistory, 
  DashboardStats, 
  ApiResponse 
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const familyApi = {
  getAll: () => api.get<ApiResponse<Family[]>>('/families'),
  getById: (id: string) => api.get<ApiResponse<Family>>(`/families/${id}`),
  create: (data: Partial<Family>) => api.post<ApiResponse<Family>>('/families', data),
  update: (id: string, data: Partial<Family>) => api.put<ApiResponse<Family>>(`/families/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<void>>(`/families/${id}`),
  getBalanceHistory: (id: string) => api.get<ApiResponse<BalanceHistory[]>>(`/families/${id}/balance-history`),
};

export const childApi = {
  getAll: () => api.get<ApiResponse<Child[]>>('/children'),
  getById: (id: string) => api.get<ApiResponse<Child>>(`/children/${id}`),
  create: (data: Partial<Child>) => api.post<ApiResponse<Child>>('/children', data),
  update: (id: string, data: Partial<Child>) => api.put<ApiResponse<Child>>(`/children/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<void>>(`/children/${id}`),
};

export const paymentApi = {
  getAll: (params?: { familyId?: string; childId?: string; limit?: number; offset?: number }) => 
    api.get<ApiResponse<Payment[]>>('/payments', { params }),
  getById: (id: string) => api.get<ApiResponse<Payment>>(`/payments/${id}`),
  create: (data: Partial<Payment>) => api.post<ApiResponse<Payment>>('/payments', data),
  update: (id: string, data: Partial<Payment>) => api.put<ApiResponse<Payment>>(`/payments/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<void>>(`/payments/${id}`),
};

export const balanceHistoryApi = {
  getAll: (params?: { familyId?: string; limit?: number; offset?: number }) =>
    api.get<ApiResponse<BalanceHistory[]>>('/balance-history', { params }),
};

export const dashboardApi = {
  getStats: () => api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),
};

export default api;