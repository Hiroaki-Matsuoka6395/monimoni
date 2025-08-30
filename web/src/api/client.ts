import axios from 'axios'

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true, // Include cookies for authentication
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any request modifications here
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common error cases
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

// API endpoints
export const api = {
  // Authentication
  auth: {
    login: (pin: string) => apiClient.post('/auth/login', { pin }),
    logout: () => apiClient.post('/auth/logout'),
    me: () => apiClient.get('/auth/me'),
  },

  // Transactions
  transactions: {
    list: (params?: Record<string, any>) => 
      apiClient.get('/transactions', { params }),
    create: (data: any) => apiClient.post('/transactions', data),
    get: (id: number) => apiClient.get(`/transactions/${id}`),
    update: (id: number, data: any) => 
      apiClient.put(`/transactions/${id}`, data),
    delete: (id: number) => apiClient.delete(`/transactions/${id}`),
    uploadReceipt: (id: number, file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return apiClient.post(`/transactions/${id}/receipts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
  },

  // Categories
  categories: {
    list: () => apiClient.get('/categories'),
    create: (data: any) => apiClient.post('/categories', data),
    update: (id: number, data: any) => 
      apiClient.put(`/categories/${id}`, data),
    delete: (id: number) => apiClient.delete(`/categories/${id}`),
  },

  // Accounts
  accounts: {
    list: () => apiClient.get('/accounts'),
    create: (data: any) => apiClient.post('/accounts', data),
    update: (id: number, data: any) => 
      apiClient.put(`/accounts/${id}`, data),
    delete: (id: number) => apiClient.delete(`/accounts/${id}`),
  },

  // Budgets
  budgets: {
    list: (month?: string) => 
      apiClient.get('/budgets', { params: { month } }),
    update: (data: any[]) => apiClient.put('/budgets', data),
  },

  // Reports
  reports: {
    monthly: (month?: string) => 
      apiClient.get('/reports/monthly', { params: { month } }),
    trend: (params?: Record<string, any>) => 
      apiClient.get('/reports/trend', { params }),
    split: (params?: Record<string, any>) => 
      apiClient.get('/reports/split', { params }),
  },

  // Files
  files: {
    uploadReceipt: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return apiClient.post('/files/receipts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    exportCSV: (params?: Record<string, any>) => 
      apiClient.get('/files/exports/transactions/csv', { 
        params,
        responseType: 'blob',
      }),
    importCSV: (file: File, dryRun = true) => {
      const formData = new FormData()
      formData.append('file', file)
      return apiClient.post('/files/imports/transactions/csv', formData, {
        params: { dry_run: dryRun },
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
  },

  // Health check
  health: () => apiClient.get('/healthz'),
}
