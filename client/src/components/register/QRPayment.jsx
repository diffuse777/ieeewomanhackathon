import { FormInput } from '../FormInput';

export function QRPayment({
  imageSrc,
  proofDriveUrl,
  paymentReference,
  referenceError,
  onReferenceChange,
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

        {proofDriveUrl ? (
          <p className="payment-proof__drive">
            <span className="payment-proof__label">Upload payment screenshot</span>
            <a href={proofDriveUrl} target="_blank" rel="noreferrer">
              {proofDriveUrl}
            </a>
          </p>
        ) : null}

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
