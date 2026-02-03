const BASE_URL = '/api'

// Token management
const TOKEN_KEY = 'payme_access_token'
const REFRESH_TOKEN_KEY = 'payme_refresh_token'
const EXPIRY_KEY = 'payme_token_expiry'

const getAccessToken = () => localStorage.getItem(TOKEN_KEY)
const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)
const getTokenExpiry = () => parseInt(localStorage.getItem(EXPIRY_KEY) || '0')

const setTokens = (accessToken, refreshToken, expiresIn) => {
  localStorage.setItem(TOKEN_KEY, accessToken)
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + expiresIn))
}

const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(EXPIRY_KEY)
}

export const isAuthenticated = () => {
  const token = getAccessToken()
  const expiry = getTokenExpiry()
  return token && expiry > Date.now()
}

// Auto-refresh token if about to expire (within 2 minutes)
const shouldRefresh = () => {
  const expiry = getTokenExpiry()
  const twoMinutes = 2 * 60 * 1000
  return expiry > 0 && expiry - Date.now() < twoMinutes
}

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    clearTokens()
    throw new Error('No refresh token')
  }

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) {
    clearTokens()
    throw new Error('Refresh failed')
  }

  const data = await response.json()
  // Save both new access token and rotated refresh token
  setTokens(data.accessToken, data.refreshToken, data.expiresIn)
  return data.accessToken
}

const request = async (endpoint, options = {}, retry = true) => {
  // Auto-refresh if token is about to expire
  if (shouldRefresh() && endpoint !== '/auth/refresh') {
    try {
      await refreshAccessToken()
    } catch {
      // Will retry after 401 if refresh fails here
    }
  }

  const token = getAccessToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Handle 401 - try refresh token
  if (
    response.status === 401 &&
    retry &&
    endpoint !== '/auth/refresh' &&
    endpoint !== '/auth/login'
  ) {
    try {
      await refreshAccessToken()
      return request(endpoint, options, false) // Retry once
    } catch {
      clearTokens()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return undefined
  }

  return response.json()
}

// Background token refresh - call this on app init
let refreshInterval = null

export const startTokenRefresh = () => {
  if (refreshInterval) return

  // Check every minute if we need to refresh
  refreshInterval = setInterval(async () => {
    if (shouldRefresh()) {
      try {
        await refreshAccessToken()
      } catch {
        // Token refresh failed, user will be redirected on next API call
      }
    }
  }, 60 * 1000)
}

export const stopTokenRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

export const api = {
  auth: {
    register: async (username, password) => {
      const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      setTokens(data.accessToken, data.refreshToken, data.expiresIn)
      startTokenRefresh()
      return data.user
    },
    login: async (username, password) => {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      setTokens(data.accessToken, data.refreshToken, data.expiresIn)
      startTokenRefresh()
      return data.user
    },
    logout: async () => {
      try {
        const refreshToken = getRefreshToken()
        await request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        })
      } finally {
        stopTokenRefresh()
        clearTokens()
      }
    },
    me: () => request('/auth/me'),
  },

  months: {
    current: () => request('/months/current'),
    get: (id) => request(`/months/${id}`),
    create: (year, month) => request(`/months?year=${year}&month=${month}`),
    close: (id) => request(`/months/${id}/close`, { method: 'POST' }),
    downloadPdf: async (id) => {
      const token = getAccessToken()
      const response = await fetch(`${BASE_URL}/months/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      return response.blob()
    },
  },

  fixedExpenses: {
    list: () => request('/fixed-expenses'),
    create: (data) =>
      request('/fixed-expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/fixed-expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id) => request(`/fixed-expenses/${id}`, { method: 'DELETE' }),
    reorder: (order) =>
      request('/fixed-expenses/reorder', {
        method: 'PUT',
        body: JSON.stringify({ order }),
      }),
  },

  fixedMonths: {
    list: (monthId) => request(`/months/${monthId}/fixed-months`),
    create: (monthId, data) =>
      request(`/months/${monthId}/fixed-months`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (monthId, id, data) =>
      request(`/months/${monthId}/fixed-months/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (monthId, id) => request(`/months/${monthId}/fixed-months/${id}`, { method: 'DELETE' }),
    reorder: (monthId, order) =>
      request(`/months/${monthId}/fixed-months/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ order }),
      }),
  },

  categories: {
    list: () => request('/categories'),
    create: (data) =>
      request('/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  },

  budgets: {
    list: (monthId) => request(`/months/${monthId}/budgets`),
    update: (monthId, budgetId, amount) =>
      request(`/months/${monthId}/budgets/${budgetId}`, {
        method: 'PUT',
        body: JSON.stringify({ allocated_amount: amount }),
      }),
  },

  income: {
    list: (monthId) => request(`/months/${monthId}/income`),
    create: (monthId, data) =>
      request(`/months/${monthId}/income`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (monthId, incomeId, data) =>
      request(`/months/${monthId}/income/${incomeId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (monthId, incomeId) =>
      request(`/months/${monthId}/income/${incomeId}`, { method: 'DELETE' }),
    reorder: (monthId, order) =>
      request(`/months/${monthId}/income/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ order }),
      }),
    copy: (monthId) =>
      request(`/months/${monthId}/income/copy`, {
        method: 'POST',
      }),
  },

  items: {
    list: (monthId) => request(`/months/${monthId}/items`),
    create: (monthId, data) =>
      request(`/months/${monthId}/items`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (monthId, itemId, data) =>
      request(`/months/${monthId}/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (monthId, itemId) =>
      request(`/months/${monthId}/items/${itemId}`, { method: 'DELETE' }),
  },

  stats: {
    get: () => request('/stats'),
  },

  savings: {
    get: () => request('/savings'),
    update: (savings) =>
      request('/savings', {
        method: 'PUT',
        body: JSON.stringify({ savings }),
      }),
  },

  settings: {
    get: () => request('/settings'),
    update: (data) =>
      request('/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  retirementSavings: {
    get: () => request('/retirement-savings'),
    update: (retirement_savings) =>
      request('/retirement-savings', {
        method: 'PUT',
        body: JSON.stringify({ retirement_savings }),
      }),
  },
}
