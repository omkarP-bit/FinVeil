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

export const authApi = {
  oauthCallback: (provider: string, code: string) =>
    api.post('/auth/oauth/callback', { provider, code }),
  refresh: () => api.post('/auth/refresh'),
}

export const profileApi = {
  submit: (encryptedFields: Record<string, string>) =>
    api.post('/profile', { encryptedFields }),
  status: () => api.get('/profile/status'),
}

export const lensApi = {
  list: () => api.get('/lens/registry'),
  request: (lensId: string, requesterAppId: string) =>
    api.post('/lens/request', { lensId, requesterAppId }),
  grantPermit: (lensId: string, requesterAppId: string, expiryHours: number) =>
    api.post('/lens/permit/grant', { lensId, requesterAppId, expiryHours }),
}

export const dashboardApi = {
  me: () => api.get('/dashboard/me'),
  accessLog: () => api.get('/dashboard/access-log'),
}

export const kycApi = {
  submit: (encryptedFields: Record<string, string>) =>
    api.post('/kyc/submit', { encryptedFields }),
  verify: (checkId: number, requesterAppId: string, sessionExpiryMinutes: number) =>
    api.post('/kyc/verify', { checkId, requesterAppId, sessionExpiryMinutes }),
}
