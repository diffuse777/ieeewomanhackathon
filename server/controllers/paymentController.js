const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/paymentService');
const paymentStatusService = require('../services/paymentStatusService');
const { getPaymentProvider } = require('../services/payment/providerFactory');
const { loadEnv } = require('../config/env');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../utils/constants');

function readWebhookSignature(req) {
  return req.get('x-razorpay-signature') || req.get('x-payment-signature');
}

function getRawWebhookBody(req) {
  if (req.rawBody) {
    return req.rawBody;
  }

  if (typeof req.body === 'string') {
    return Buffer.from(req.body, 'utf8');
  }

  return Buffer.from(JSON.stringify(req.body || {}), 'utf8');
}

const createPaymentOrder = asyncHandler(async (req, res) => {
  const data = await paymentService.createPaymentOrder(req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Payment order created successfully',
    data,
  });
});

const getPaymentStatus = asyncHandler(async (req, res) => {
  const data = await paymentService.getPaymentStatus(req.params.registrationId);

  return sendSuccess(res, {
    message: 'Payment status fetched successfully',
    data,
  });
});

const handleWebhook = asyncHandler(async (req, res) => {
  const provider = getPaymentProvider(loadEnv().payment);
  const rawBody = getRawWebhookBody(req);
  const signature = readWebhookSignature(req);

  if (!provider.verifyWebhookSignature(rawBody, signature)) {
    throw new AppError('Invalid webhook signature', 401, ERROR_CODES.INVALID_WEBHOOK_SIGNATURE);
  }

  const payload = (() => {
    try {
      return JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody));
    } catch {
      throw new AppError('Invalid webhook payload', 400, ERROR_CODES.BAD_REQUEST);
    }
  })();
  const event = provider.parseWebhookEvent(payload);
  const result = await paymentStatusService.applyWebhookEvent(event);

  return sendSuccess(res, {
    message: 'Webhook processed',
    data: {
      outcome: result.outcome,
      paymentStatus: result.paymentStatus,
    },
  });
});

const simulateMockPayment = asyncHandler(async (req, res) => {
  const data = await paymentService.simulateMockPayment({
    registrationId: req.body?.registrationId,
    result: req.body?.result,
  });

  return sendSuccess(res, {
    message: 'Mock payment processed',
    data,
  });
});

const submitPaymentReference = asyncHandler(async (req, res) => {
  const data = await paymentService.submitPaymentReference({
    registrationId: req.params.registrationId,
    paymentReference: req.body?.paymentReference,
  });

  return sendSuccess(res, {
    message: 'Payment reference saved',
    data,
  });
});

const confirmManualUpiPayment = asyncHandler(async (req, res) => {
  const data = await paymentService.confirmManualUpiPayment({
    registrationId: req.params.registrationId,
    paymentReference: req.body?.paymentReference,
  });

  return sendSuccess(res, {
    message: 'Payment confirmed',
    data,
  });
});

const getPaymentQrImage = asyncHandler(async (req, res) => {
  const { getUpiQrPngBuffer } = require('../utils/upiPaymentQr');
  const pngBuffer = getUpiQrPngBuffer();
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Length', pngBuffer.length);
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  return res.status(200).send(pngBuffer);
});

const downloadTeamConfirmationPdf = asyncHandler(async (req, res) => {
  const {
    writeTeamConfirmationPdf,
    sanitizeFilenamePart,
  } = require('../utils/teamConfirmationPdf');

  const registration = await paymentService.getPaidRegistrationForConfirmation(
    req.params.registrationId
  );
  const filename = `team-confirmation-${sanitizeFilenamePart(registration.teamName)}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  await writeTeamConfirmationPdf(registration, res);
});

module.exports = {
  createPaymentOrder,
  getPaymentStatus,
  submitPaymentReference,
  confirmManualUpiPayment,
  handleWebhook,
  simulateMockPayment,
  getPaymentQrImage,
  downloadTeamConfirmationPdf,
};
