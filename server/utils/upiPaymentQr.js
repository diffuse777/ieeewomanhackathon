const fs = require('fs');
const path = require('path');

const QR_IMAGE_PATH = path.join(__dirname, '..', 'assets', 'upi-payment-qr.png');

const UPI_PAYEE = Object.freeze({
  vpa: '69097701@ubin',
  name: 'DIGITAL DREAMS',
});

const PAYMENT_PROOF_DRIVE_URL =
  'https://drive.google.com/drive/folders/1YT7vz8VuxojESKf2HtM87XTZrEK0zvPV';

let cachedDataUrl;
let cachedBuffer;

function getUpiPayee() {
  return UPI_PAYEE;
}

function getPaymentProofDriveUrl() {
  return PAYMENT_PROOF_DRIVE_URL;
}

function getUpiQrPngBuffer() {
  if (cachedBuffer) {
    return cachedBuffer;
  }

  if (!fs.existsSync(QR_IMAGE_PATH)) {
    throw new Error('Payment QR image is missing on the server');
  }

  cachedBuffer = fs.readFileSync(QR_IMAGE_PATH);
  return cachedBuffer;
}

function getUpiQrImageDataUrl() {
  if (cachedDataUrl) {
    return cachedDataUrl;
  }

  const bytes = getUpiQrPngBuffer();
  cachedDataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
  return cachedDataUrl;
}

module.exports = {
  getUpiQrImageDataUrl,
  getUpiQrPngBuffer,
  getUpiPayee,
  getPaymentProofDriveUrl,
};
