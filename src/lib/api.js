const BASE_URL = '/api'

const request = async (endpoint, options = {}) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return undefined
  }

  return response.json()
}

export const api = {
  auth: {
    register: (username, password) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    login: (username, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
  },

  months: {
    current: () => request('/months/current'),
    get: (id) => request(`/months/${id}`),
    create: (year, month) => request(`/months?year=${year}&month=${month}`),
    close: (id) => request(`/months/${id}/close`, { method: 'POST' }),
    downloadPdf: async (id) => {
      const response = await fetch(`${BASE_URL}/months/${id}/pdf`, {
        credentials: 'include',
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

  retirementSavings: {
    get: () => request('/retirement-savings'),
    update: (retirement_savings) =>
      request('/retirement-savings', {
        method: 'PUT',
        body: JSON.stringify({ retirement_savings }),
      }),
  },
}
