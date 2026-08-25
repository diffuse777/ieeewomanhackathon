import { API_ENDPOINTS } from '../constants/api';
import { httpClient, unwrapApi } from './httpClient';

export async function createPaymentOrder(registrationId) {
  const response = await httpClient.post(API_ENDPOINTS.PAYMENT_ORDERS, { registrationId });
  return unwrapApi(response);
}

export async function getPaymentStatus(registrationId) {
  const response = await httpClient.get(API_ENDPOINTS.PAYMENT_STATUS(registrationId));
  return unwrapApi(response);
}

export async function submitPaymentReference(registrationId, paymentReference) {
  const response = await httpClient.post(API_ENDPOINTS.PAYMENT_REFERENCE(registrationId), {
    paymentReference,
  });
  return unwrapApi(response);
}

export async function confirmManualUpiPayment(registrationId, paymentReference) {
  const response = await httpClient.post(API_ENDPOINTS.PAYMENT_CONFIRM(registrationId), {
    paymentReference,
  });
  return unwrapApi(response);
}

export async function completeMockPayment(registrationId, result = 'success') {
  const response = await httpClient.post(API_ENDPOINTS.PAYMENT_MOCK_COMPLETE, {
    registrationId,
    result,
  });
  return unwrapApi(response);
}

export async function downloadTeamConfirmationPdf(registrationId, teamName = 'team') {
  const response = await httpClient.get(API_ENDPOINTS.PAYMENT_CONFIRMATION_PDF(registrationId), {
    responseType: 'blob',
    timeout: 60000,
  });

  const contentType = response.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    const text = await response.data.text();
    const payload = JSON.parse(text);
    throw new Error(payload.message || 'Could not download confirmation PDF.');
  }

  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const safeTeam =
    String(teamName || 'team')
      .trim()
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'team';
  const filename = match?.[1] || `team-confirmation-${safeTeam}.pdf`;
  const blob =
    response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: 'application/pdf' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
