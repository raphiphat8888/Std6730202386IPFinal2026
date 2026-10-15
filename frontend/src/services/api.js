const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.message || 'Request failed.');
  return data;
}

export const api = {
  login: (username, password) => request('/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  employees: () => request('/employees'),
  createEmployee: (employee) => request('/employees', { method: 'POST', body: JSON.stringify(employee) }),
  toggleStatus: (id) => request(`/employees/${id}/status`, { method: 'PUT' }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
  salaryClusters: () => request('/employees/salary-clusters'),
};
