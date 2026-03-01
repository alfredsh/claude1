import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'
// Base URL for static files (uploads) served by the backend
export const BACKEND_URL = API_URL.replace(/\/api$/, '')

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
}

// Patient
export const patientAPI = {
  getProfile: () => api.get('/patient/profile'),
  updateProfile: (data: any) => api.put('/patient/profile', data),
  addMetric: (data: any) => api.post('/patient/metrics', data),
  getMetrics: (params?: any) => api.get('/patient/metrics', { params }),
  getSupplements: () => api.get('/patient/supplements'),
  getRecommendations: () => api.get('/patient/recommendations'),
  addNutrition: (data: any) => api.post('/patient/nutrition', data),
  getNutrition: (params?: any) => api.get('/patient/nutrition', { params }),
  analyzeNutritionPhoto: (data: FormData) => api.post('/patient/nutrition/analyze-photo', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

// Lab
export const labAPI = {
  upload: (data: FormData) => api.post('/lab/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  parsePdf: (data: FormData) => api.post('/lab/parse-pdf', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: () => api.get('/lab'),
  getOne: (id: string) => api.get(`/lab/${id}`),
  delete: (id: string) => api.delete(`/lab/${id}`),
}

// Medical Documents
export const medicalDocAPI = {
  upload: (data: FormData) => api.post('/medical/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: () => api.get('/medical'),
  delete: (id: string) => api.delete(`/medical/${id}`),
  reanalyze: (id: string) => api.post(`/medical/${id}/reanalyze`),
}

// AI
export const aiAPI = {
  chat: (data: any) => api.post('/ai/chat', data),
  getSessions: () => api.get('/ai/chat/sessions'),
  getSession: (id: string) => api.get(`/ai/chat/sessions/${id}`),
  generateRecommendations: () => api.post('/ai/recommendations/generate'),
  getSettings: () => api.get('/ai/settings'),
}

// Doctor
export const doctorAPI = {
  getProfile: () => api.get('/doctor/profile'),
  getPatients: (params?: any) => api.get('/doctor/patients', { params }),
  getPatient: (id: string) => api.get(`/doctor/patients/${id}`),
  addPrescription: (data: any) => api.post('/doctor/prescriptions', data),
  addRecommendation: (data: any) => api.post('/doctor/recommendations', data),
  analyzePatient: (id: string) => api.post(`/doctor/patients/${id}/analyze`),
  getPatientDocs: (id: string) => api.get(`/doctor/patients/${id}/documents`),
}
