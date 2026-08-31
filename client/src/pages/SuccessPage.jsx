import { Navigate } from 'react-router-dom';
import { ButtonLink } from '../components/ButtonLink';
import { formatMoney, HACKATHON } from '../constants/hackathon';
import { ROUTES } from '../constants/routes';
import { usePageTitle } from '../hooks/usePageTitle';
import { loadSuccessSnapshot } from '../utils/registrationDraft';

const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/D7OSbJMmGoH6J7c539mSyt?s=qt&p=a&mlu=4';
const WHATSAPP_GROUP_QR = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(WHATSAPP_GROUP_LINK)}`;

export function SuccessPage() {
  const snapshot = loadSuccessSnapshot();
  usePageTitle(`${HACKATHON.eventName} · Registration successful`);

  if (!snapshot || snapshot.paymentStatus !== 'PAID') {
    return <Navigate to={ROUTES.REGISTER} replace />;
  }

  return (
    <article className="page-screen page-screen--narrow">
      <p className="eyebrow">Confirmed</p>
      <h1 className="heading-serif">Registration successful</h1>
      <div className="rule-line" aria-hidden="true">
        <span className="rule-line__diamond" />
      </div>
      <p className="lede">Payment is successful. Be ready to face the challenge.</p>
      <section className="card">
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
          <dd>{snapshot.teamName}</dd>
          <dt>Number of participants</dt>
          <dd>{snapshot.memberCount}</dd>
          <dt>Total paid</dt>
          <dd>{formatMoney(snapshot.totalAmount)}</dd>
          <dt>Payment status</dt>
          <dd>{snapshot.paymentStatus}</dd>
          {snapshot.paymentReference ? (
            <>
              <dt>Payment reference</dt>
              <dd>{snapshot.paymentReference}</dd>
            </>
          ) : null}
        </dl>
      </section>
      <p>
        <ButtonLink to={ROUTES.HOME}>Return home</ButtonLink>
      </p>
    </article>
  );
}
