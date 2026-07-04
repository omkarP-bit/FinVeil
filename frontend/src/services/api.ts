import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/'
    }
    return Promise.reject(err)
  },
)

export default api

export interface EncryptedField {
  data: string
  securityZone: number
}

export const authApi = {
  supabaseLogin: (accessToken: string) =>
    api.post('/auth/supabase', { accessToken }),
  refresh: () => api.post('/auth/refresh'),
}

export const profileApi = {
  submit: (features: Record<string, number>) =>
    api.post('/profile', { features }),
  submitEncrypted: (features: Record<string, EncryptedField>) =>
    api.post('/profile', { features }),
  status: () => api.get('/profile/status'),
}

export const lensApi = {
  list: () => api.get('/lens/registry'),
  request: (lensId: string, requesterAppId: string) =>
    api.post('/lens/request', { lensId, requesterAppId }),
  grantPermit: (lensId: string, requesterAppId: string, expiryHours: number) =>
    api.post('/lens/permit/grant', { lensId, requesterAppId, expiryHours }),
  score: (lensId: string) => api.post('/lens/score', { lensId }),
}

export const dashboardApi = {
  me: () => api.get('/dashboard/me'),
  accessLog: () => api.get('/dashboard/access-log'),
}

export const aggregateApi = {
  byLens: (lensId: string) => api.get(`/aggregate/${lensId}`),
}

export const kycApi = {
  submit: (fields: Record<string, string>) =>
    api.post('/kyc/submit', { fields }),
  submitEncrypted: (fields: Record<string, EncryptedField>) =>
    api.post('/kyc/submit', { fields }),
  verify: (checkId: number, requesterAppId: string, sessionExpiryMinutes: number) =>
    api.post('/kyc/verify', { checkId, requesterAppId, sessionExpiryMinutes }),
}

export const verifyApi = {
  privacy: () => api.get('/verify/privacy'),
}

export const appsApi = {
  list: () => api.get('/apps/registry'),
}
