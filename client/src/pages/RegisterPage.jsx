import { useNavigate } from 'react-router-dom';
import { FormInput } from '../components/FormInput';
import { SelectInput } from '../components/SelectInput';
import { HACKATHON, estimateRegistrationTotal, formatFeePerParticipant, formatMoney } from '../constants/hackathon';
import { ROUTES } from '../constants/routes';
import { useRegistrationDraft } from '../context/RegistrationDraftContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { validateTeamStep } from '../utils/registrationForm';
import { useState } from 'react';
import { useEffect } from 'react';
import { getHealth } from '../services/healthService';

export function RegisterPage() {
  const navigate = useNavigate();
  const { draft, update } = useRegistrationDraft();
  const [errors, setErrors] = useState({});
  usePageTitle(`${HACKATHON.eventName} · Register`);

  const memberOptions = Array.from(
    { length: HACKATHON.team.maxMembers - HACKATHON.team.minMembers + 1 },
    (_, index) => HACKATHON.team.minMembers + index
  );

  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [windowInfo, setWindowInfo] = useState(null);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    let mounted = true;
    getHealth()
      .then((res) => {
        const data = res.data || {};
        const win = data.registrationWindow || null;
        if (!mounted) return;
        setWindowInfo(win);
        setRegistrationOpen(win ? Boolean(win.open) : true);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!windowInfo) return undefined;

    function fmt(ms) {
      if (ms <= 0) return '0s';
      const s = Math.floor(ms / 1000) % 60;
      const m = Math.floor(ms / (60 * 1000)) % 60;
      const h = Math.floor(ms / (60 * 60 * 1000)) % 24;
      const d = Math.floor(ms / (24 * 60 * 60 * 1000));
      return `${d ? d + 'd ' : ''}${h ? h + 'h ' : ''}${m ? m + 'm ' : ''}${s}s`;
    }

    let target = null;
    const now = Date.now();
    if (windowInfo.startAt && new Date(windowInfo.startAt).getTime() > now) {
      target = new Date(windowInfo.startAt).getTime();
    } else if (windowInfo.endAt && new Date(windowInfo.endAt).getTime() > now) {
      target = new Date(windowInfo.endAt).getTime();
    }

    if (!target) {
      setCountdown('');
      return undefined;
    }

    function tick() {
      const remaining = target - Date.now();
      setCountdown(fmt(remaining));
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [windowInfo]);

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateTeamStep(draft.teamName, Number(draft.memberCount));
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    navigate(ROUTES.REGISTER_PARTICIPANTS);
  }

  return (
    <article className="register-page">
      <p className="eyebrow">Team registration</p>
      <h1 className="heading-serif">Team registration</h1>
      <p className="serif-kicker">Join the expo</p>
      <div className="rule-line" aria-hidden="true">
        <span className="rule-line__diamond" />
      </div>
      <p className="lede">
        Name the team and choose how many participants will compete. Hostel fields appear only for
        hostel students on the next step. The fee is {formatFeePerParticipant()}.
      </p>

      {registrationOpen ? (
        <form className="register-form" onSubmit={handleSubmit} noValidate>
          {windowInfo && windowInfo.open ? (
            <div className="register-banner register-banner--open">
              Registration is open. Closes in {countdown || '—'}.
            </div>
          ) : null}
        <FormInput
          id="teamName"
          label="Team name"
          value={draft.teamName}
          error={errors.teamName}
          maxLength={80}
          autoComplete="organization"
          required
          onChange={(value) => update({ teamName: value, submitted: false, registration: null })}
        />
        <SelectInput
          id="memberCount"
          label="Number of team members"
          value={String(draft.memberCount)}
          error={errors.memberCount}
          onChange={(value) =>
            update({
              memberCount: Number(value),
              submitted: false,
              registration: null,
            })
          }
        >
          {memberOptions.map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </SelectInput>

        <p className="fee-preview">
          <span className="fee-preview__amount">
            {formatMoney(estimateRegistrationTotal(Number(draft.memberCount) || 0))}
          </span>
          <span className="fee-preview__note">
            Browser estimate. Payable amount is calculated on the server.
          </span>
        </p>

        <button className="btn" type="submit">
          Continue to participants
        </button>
        </form>
      ) : (
        <div className="register-closed">
          <p className="lede">Registration is currently closed.</p>
          {windowInfo ? (
            <p>
              {windowInfo.startAt && new Date(windowInfo.startAt) > new Date()
                ? `Opens in ${countdown || '—'}`
                : `Closed — Opens: ${windowInfo.startAt || '—'} · Closes: ${windowInfo.endAt || '—'}`}
            </p>
          ) : null}
        </div>
      )}
    </article>
  );
}
