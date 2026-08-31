import { FormInput } from '../FormInput';

export function QRPayment({
  imageSrc,
  proofDriveUrl,
  paymentReference,
  referenceError,
  onReferenceChange,
  proofUploaded,
  redirectedToDrive,
  onUploadDone,
}) {
  if (!imageSrc) {
    return null;
  }

  return (
    <div className="qr-block">
      <figure className="qr-wrap">
        <img src={imageSrc} alt="UPI payment QR code" width={320} height={320} />
      </figure>

      <div className="payment-proof">
        {proofDriveUrl && redirectedToDrive ? (
          <div className="payment-proof__upload-status">
            <p className="payment-proof__label">Upload payment screenshot</p>
            <div className="payment-proof__upload-inline">
              <p className="payment-proof__status-message">Waiting for upload…</p>
              <button
                type="button"
                className="btn btn--secondary payment-proof__done-button"
                onClick={onUploadDone}
              >
                Done uploading
              </button>
            </div>
            {proofUploaded ? (
              <p className="payment-proof__success-message">✓ Payment proof uploaded successfully</p>
            ) : null}
          </div>
        ) : null}

        <FormInput
          id="upi-reference-id"
          label="Enter the UPI reference id"
          value={paymentReference}
          error={referenceError}
          autoComplete="off"
          maxLength={64}
          placeholder="UPI / bank transaction ID"
          onChange={onReferenceChange}
        />

        <ol className="payment-proof__notes">
          <li>Take the payment screenshot and upload it in the given link.</li>
          <li>The image should be in the format your_team_name.png / .jpg / .jpeg.</li>
        </ol>

        <div className="payment-backup-account">
          <p className="payment-backup-label"><strong>In case QR is not visible, use this account number:</strong></p>
          <dl className="payment-account-details">
            <dt>Name:</dt>
            <dd>DIGITAL DREAMS</dd>
            <dt>Account number:</dt>
            <dd>335602011000163</dd>
            <dt>IFSC Code:</dt>
            <dd>UBIN0562734</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
