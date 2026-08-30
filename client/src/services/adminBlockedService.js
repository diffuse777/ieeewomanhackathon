import { API_ENDPOINTS } from '../constants/api';
import { httpClient, unwrapApi } from './httpClient';

export async function listBlocked() {
  const response = await httpClient.get(API_ENDPOINTS.ADMIN_BLOCKED);
  return unwrapApi(response);
}

export async function blockRegisterNumber(payload) {
  const response = await httpClient.post(API_ENDPOINTS.ADMIN_BLOCKED, payload);
  return unwrapApi(response);
}

export async function unblockRegisterNumber(idOrKey) {
  const response = await httpClient.delete(`${API_ENDPOINTS.ADMIN_BLOCKED}/${encodeURIComponent(idOrKey)}`);
  return unwrapApi(response);
}

export async function unblockAllRegisterNumbers() {
  const response = await httpClient.delete(`${API_ENDPOINTS.ADMIN_BLOCKED}/all`);
  return unwrapApi(response);
}

export async function getBlockedRegisterNumber(idOrKey) {
  const response = await httpClient.get(`${API_ENDPOINTS.ADMIN_BLOCKED}/${encodeURIComponent(idOrKey)}`);
  return unwrapApi(response);
}
