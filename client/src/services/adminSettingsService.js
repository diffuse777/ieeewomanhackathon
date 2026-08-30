import { API_ENDPOINTS } from '../constants/api';
import { httpClient, unwrapApi } from './httpClient';

export async function getAdminSettings() {
  const response = await httpClient.get(API_ENDPOINTS.ADMIN_SETTINGS);
  return unwrapApi(response);
}

export async function updateAdminSettings(payload) {
  const response = await httpClient.put(API_ENDPOINTS.ADMIN_SETTINGS, payload);
  return unwrapApi(response);
}
