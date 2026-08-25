import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import { normalizeApiError } from '../utils/apiError';
import { clearAdminToken, getAdminToken } from '../utils/authStorage';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const token = getAdminToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeApiError(error);
    if (normalized.status === 401 && getAdminToken()) {
      clearAdminToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-auth-expired'));
      }
    }
    return Promise.reject(normalized);
  }
);

export function unwrapApi(response) {
  const body = response?.data || {};

  return {
    success: Boolean(body.success),
    message: body.message || '',
    data: body.data ?? {},
  };
}
