import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { Modal } from '../components/Modal';
import { PaymentSummary } from '../components/register/PaymentSummary';
import { QRPayment } from '../components/register/QRPayment';
import { formatMoney, HACKATHON } from '../constants/hackathon';
import { PAYMENT_STATUSES, BLOCKED_REGISTER_MESSAGE } from '../constants/registration';
import { API_ERROR_CODES } from '../constants/api';
import { ROUTES } from '../constants/routes';
import { useRegistrationDraft } from '../context/RegistrationDraftContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { API_BASE_URL } from '../constants/api';
import {
  confirmManualUpiPayment,
  createPaymentOrder,
  downloadTeamConfirmationPdf,
  getPaymentStatus,
  submitPaymentReference,
} from '../services/paymentService';
import { getErrorMessage } from '../utils/apiError';
import { clearDraft, saveSuccessSnapshot } from '../utils/registrationDraft';

const SERVER_QR_IMAGE_URL = `${API_BASE_URL}/payments/qr-image`;
const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/D7OSbJMmGoH6J7c539mSyt?s=qt&p=a&mlu=4';
const WHATSAPP_GROUP_QR = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(WHATSAPP_GROUP_LINK)}`;

function mergePaymentOrder(current, next) {
  if (!next) {
    return current;
  }

  return {
    ...(current || {}),
    ...next,
    paymentRequest: next.paymentRequest || current?.paymentRequest || null,
  };
}

export function PaymentPage() {
  const navigate = useNavigate();
  const { draft, reset } = useRegistrationDraft();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState(null);
  const [loadingLabel, setLoadingLabel] = useState('Generating payment…');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [referenceError, setReferenceError] = useState('');
  const [savingReference, setSavingReference] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [blockedNotice, setBlockedNotice] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [redirectedToDrive, setRedirectedToDrive] = useState(false);
  const leavingHomeRef = useRef(false);
  usePageTitle(`${HACKATHON.eventName} · Payment`);

  const registrationId = draft.registration?.id;

  useEffect(() => {
    if (!registrationId) {
      return undefined;
    }

    let cancelled = false;

    async function start() {
      setLoadingLabel('Generating payment…');
      setError('');
      try {
        const result = await createPaymentOrder(registrationId);
        if (!cancelled) {
          setOrder(result.data);
          setStatus(result.data.paymentStatus);
        }
      } catch (err) {
        if (err.code === 'PAYMENT_ALREADY_COMPLETED') {
          try {
            const current = await getPaymentStatus(registrationId);
            if (!cancelled) {
              setStatus(current.data.paymentStatus);
              setOrder((existing) => mergePaymentOrder(existing, current.data));
              if (current.data.paymentStatus === PAYMENT_STATUSES.PAID) {
                setShowSuccess(true);
              }
            }
          } catch (statusError) {
            if (!cancelled) {
              setError(getErrorMessage(statusError));
            }
          }
        } else if (!cancelled) {
          if (err.code === API_ERROR_CODES.BLOCKED_REGISTER_NUMBER) {
            setBlockedNotice(true);
          }
          setError(getErrorMessage(err));
        }
      }
    }

    start();
    return () => {
      cancelled = true;
    };
  }, [registrationId]);

  useEffect(() => {
    if (!registrationId || status === PAYMENT_STATUSES.PAID) {
      return undefined;
    }

    const timer = window.setInterval(async () => {
      try {
        setLoadingLabel('Verifying payment…');
        const result = await getPaymentStatus(registrationId);
        setStatus(result.data.paymentStatus);
        setOrder((current) => mergePaymentOrder(current, result.data));
      } catch {
        // Keep polling; a transient network error should not fake success.
      }
    }, 4000);

    return () => window.clearInterval(timer);
  }, [registrationId, status]);

  useEffect(() => {
    if (status !== PAYMENT_STATUSES.PAID || !order) {
      return;
    }

    const snapshot = {
      teamName: order.teamName || draft.teamName,
      memberCount: order.memberCount || draft.memberCount,
      totalAmount: order.amount,
      paymentStatus: PAYMENT_STATUSES.PAID,
      paymentReference: paymentReference.trim() || order.paymentReference || '',
    };
    saveSuccessSnapshot(snapshot);
  }, [status, order, draft.teamName, draft.memberCount]);

  function goHome() {
    leavingHomeRef.current = true;
    navigate(ROUTES.HOME, { replace: true });
    reset();
    clearDraft();
  }

  async function handleDownloadConfirmation() {
    if (!registrationId) {
      return;
    }

    setPdfError('');
    setDownloadingPdf(true);
    try {
      await downloadTeamConfirmationPdf(
        registrationId,
        order?.teamName || draft.teamName || 'team'
      );
    } catch (err) {
      setPdfError(getErrorMessage(err) || 'Could not download confirmation PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  }

  if (leavingHomeRef.current) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (!registrationId) {
    return <Navigate to={ROUTES.REGISTER_PARTICIPANTS} replace />;
  }

  const qrFromOrder = order?.paymentRequest?.qrImageDataUrl;
  const qrFromStatusPath = order?.paymentRequest?.qrImageUrl
    ? `${API_BASE_URL}${order.paymentRequest.qrImageUrl}`
    : null;
  const qrImage = qrFromOrder || qrFromStatusPath || (order ? SERVER_QR_IMAGE_URL : null);
  const amount = order?.amount;
  const provider = order?.paymentRequest?.provider;
  const proofDriveUrl = order?.paymentRequest?.proofDriveUrl;
  const trimmedReference = paymentReference.trim();
  const referenceLooksValid = /^[A-Za-z0-9][A-Za-z0-9/_-]{5,63}$/.test(trimmedReference);

  async function handleVerify() {
    setError('');
    setReferenceError('');

    // If proof hasn't been uploaded yet, redirect to Google Drive
    if (!proofUploaded && proofDriveUrl) {
      setLoadingLabel('Opening upload folder…');
      window.open(proofDriveUrl, '_blank');
      setRedirectedToDrive(true);
      return;
    }

    setLoadingLabel('Verifying payment…');

    if (!referenceLooksValid) {
      setReferenceError('Enter the UPI reference id (6–64 characters).');
      return;
    }

    try {
      setSavingReference(true);

      // Manual UPI QR (mock provider): confirm with the entered reference — works on Vercel.
      if (provider === 'mock' || !provider) {
        const confirmed = await confirmManualUpiPayment(registrationId, trimmedReference);
        setStatus(confirmed.data.paymentStatus);
        setOrder((current) =>
          mergePaymentOrder(current, {
            ...confirmed.data,
            amount,
            teamName: order?.teamName || draft.teamName,
            memberCount: order?.memberCount || draft.memberCount,
          })
        );

        if (confirmed.data.paymentStatus !== PAYMENT_STATUSES.PAID) {
          setError('Payment is still pending. Complete the transfer, then verify again.');
          return;
        }

        saveSuccessSnapshot({
          teamName: order?.teamName || draft.teamName,
          memberCount: order?.memberCount || draft.memberCount,
          totalAmount: amount,
          paymentStatus: PAYMENT_STATUSES.PAID,
          paymentReference: trimmedReference,
        });
        setShowSuccess(true);
        return;
      }

      // Gateway providers: wait until webhook marks PAID, then store reference.
      const result = await getPaymentStatus(registrationId);
      setStatus(result.data.paymentStatus);
      setOrder((current) => mergePaymentOrder(current, result.data));

      if (result.data.paymentStatus !== PAYMENT_STATUSES.PAID) {
        setError(
          result.data.paymentStatus === PAYMENT_STATUSES.FAILED
            ? 'Payment failed. Please try again.'
            : 'Payment is still pending. Complete the transfer, then verify again.'
        );
        return;
      }

      await submitPaymentReference(registrationId, trimmedReference);
      saveSuccessSnapshot({
        teamName: order?.teamName || draft.teamName,
        memberCount: order?.memberCount || draft.memberCount,
        totalAmount: amount,
        paymentStatus: PAYMENT_STATUSES.PAID,
        paymentReference: trimmedReference,
      });
      setShowSuccess(true);
    } catch (err) {
      if (err?.details || String(err?.message || '').toLowerCase().includes('reference')) {
        setReferenceError(getErrorMessage(err));
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setSavingReference(false);
    }
  }

  function handleFinish() {
    goHome();
  }

  return (
    <article className="register-page">
      <p className="eyebrow">Payment</p>
      <h1 className="heading-serif">Payment</h1>
      <p className="lede">
        Scan the QR code, enter the amount shown below in your UPI app, fill the UPI reference id,
        then verify after paying.
      </p>

      {error ? <ErrorState title="Payment verification failed" message={error} onRetry={handleVerify} /> : null}

      {!order && !error ? <LoadingState label={loadingLabel} /> : null}

      {order ? (
        <div className="register-layout">
          <div>
            <PaymentSummary
              teamName={order.teamName || draft.teamName}
              memberCount={order.memberCount || draft.memberCount}
              amount={amount}
            />
            <p className="payment-amount">{amount != null ? formatMoney(amount) : 'Calculating amount…'}</p>
            {qrImage ? (
              <QRPayment
                imageSrc={qrImage}
                proofDriveUrl={proofDriveUrl}
                paymentReference={paymentReference}
                referenceError={referenceError}
                onReferenceChange={(value) => {
                  setPaymentReference(value);
                  setReferenceError('');
                }}
                proofUploaded={proofUploaded}
                redirectedToDrive={redirectedToDrive}
                onUploadDone={() => setProofUploaded(true)}
              />
            ) : (
              <ErrorState
                title="Payment QR unavailable"
                message="The payment provider did not return a QR code. Do not invent or upload a substitute image."
              />
            )}
            <p className="lede">
              Amount payable: {amount != null ? formatMoney(amount) : 'awaiting server total'}. Payment
              status: {status || PAYMENT_STATUSES.PENDING}.
            </p>
            {redirectedToDrive && !proofUploaded ? (
              <div className="payment-upload-inline">
                <span className="payment-upload-inline__text">Waiting for upload…</span>
                <button
                  type="button"
                  className="btn btn--secondary payment-upload-inline__button"
                  onClick={() => setProofUploaded(true)}
                >
                  Done uploading
                </button>
              </div>
            ) : (
              <button className="btn" type="button" onClick={handleVerify} disabled={savingReference}>
                {savingReference
                  ? 'Saving…'
                  : proofUploaded
                    ? 'Verify payment'
                    : proofDriveUrl
                      ? 'Upload proof to Google Drive'
                      : 'Verify payment'}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {showSuccess ? (
        <Modal title="Payment successful">
          <p>Payment is successful.</p>
          <p className="serif-kicker modal__challenge">Be ready to face the challenge.</p>
          <div className="whatsapp-join-card">
            <img
              className="whatsapp-join-card__qr"
              src={WHATSAPP_GROUP_QR}
              alt="WhatsApp group QR code"
            />
            <div className="whatsapp-join-card__content">
              <p className="whatsapp-join-card__title">Join the WhatsApp group</p>
              <a
                className="whatsapp-join-card__link"
                href={WHATSAPP_GROUP_LINK}
                target="_blank"
                rel="noreferrer"
              >
                {WHATSAPP_GROUP_LINK}
              </a>
            </div>
          </div>
          <dl className="summary-grid">
            <dt>Team name</dt>
            <dd>{order?.teamName || draft.teamName}</dd>
            <dt>Participants</dt>
            <dd>{order?.memberCount || draft.memberCount}</dd>
            <dt>Total amount</dt>
            <dd>{amount != null ? formatMoney(amount) : '—'}</dd>
            {paymentReference.trim() ? (
              <>
                <dt>Payment reference</dt>
                <dd>{paymentReference.trim()}</dd>
              </>
            ) : null}
          </dl>
          {pdfError ? <p className="form-error">{pdfError}</p> : null}
          <div className="register-form__bar payment-success-actions">
            <button
              className="btn btn--secondary"
              type="button"
              onClick={handleDownloadConfirmation}
              disabled={downloadingPdf}
            >
              {downloadingPdf ? 'Preparing PDF…' : 'Download confirmation'}
            </button>
            <button className="btn" type="button" onClick={handleFinish}>
              OK
            </button>
          </div>
        </Modal>
      ) : null}

      {blockedNotice ? (
        <Modal title="Registration blocked" onClose={() => setBlockedNotice(false)}>
          <p>{BLOCKED_REGISTER_MESSAGE}</p>
          <div className="register-form__bar">
            <button className="btn" type="button" onClick={() => setBlockedNotice(false)}>
              OK
            </button>
          </div>
        </Modal>
      ) : null}
    </article>
  );
}
