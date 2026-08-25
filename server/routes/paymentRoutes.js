const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.post('/orders', paymentController.createPaymentOrder);
router.post('/webhook', paymentController.handleWebhook);
router.post('/mock/complete', paymentController.simulateMockPayment);
router.get('/qr-image', paymentController.getPaymentQrImage);
router.post('/:registrationId/confirm', paymentController.confirmManualUpiPayment);
router.post('/:registrationId/reference', paymentController.submitPaymentReference);
router.get('/:registrationId/status', paymentController.getPaymentStatus);
router.get('/:registrationId/confirmation.pdf', paymentController.downloadTeamConfirmationPdf);

module.exports = router;
