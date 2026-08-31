import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormInput } from '../components/FormInput';
import { SelectInput } from '../components/SelectInput';
import { ParticipantForm } from '../components/register/ParticipantForm';
import { RegistrationSummary } from '../components/register/RegistrationSummary';
import { HACKATHON } from '../constants/hackathon';
import { API_ERROR_CODES } from '../constants/api';
import { ROUTES } from '../constants/routes';
import { useRegistrationDraft } from '../context/RegistrationDraftContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { createRegistration } from '../services/registrationService';
import { getErrorMessage } from '../utils/apiError';
import {
  BLOCKED_REGISTER_MESSAGE,
  fieldErrorsFromApi,
  findBlockedRegisterIndex,
  isBlockedRegisterNumber,
  toRegistrationPayload,
  updateMemberField,
  validateRegistrationForm,
  validateTeamStep,
} from '../utils/registrationForm';

export function AdminAddTeamsPage() {
  const navigate = useNavigate();
  const { draft, setDraft, update } = useRegistrationDraft();
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [blockedNotice, setBlockedNotice] = useState(false);
  const [teamErrors, setTeamErrors] = useState({});
  const [paymentMode, setPaymentMode] = useState('CASH');
  usePageTitle(`${HACKATHON.eventName} · Add Teams`);

  const memberOptions = Array.from(
    { length: HACKATHON.team.maxMembers - HACKATHON.team.minMembers + 1 },
    (_, index) => HACKATHON.team.minMembers + index
  );

  function handleTeamSubmit(event) {
    event.preventDefault();
    const nextErrors = validateTeamStep(draft.teamName, Number(draft.memberCount));
    setTeamErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError('Please fix the team details before continuing.');
      return;
    }
    setFormError('');
    setReviewing(true);
  }

  function markBlockedRegister(index) {
    setBlockedNotice(true);
    setReviewing(false);
    setFormError(BLOCKED_REGISTER_MESSAGE);
    if (index >= 0) {
      setFieldErrors((current) => ({
        ...current,
        [`members[${index}].registerNumber`]: BLOCKED_REGISTER_MESSAGE,
      }));
    }
  }

  function handleMemberChange(index, field, value) {
    setDraft((current) => ({
      ...current,
      submitted: false,
      registration: null,
      members: current.members.map((member, memberIndex) =>
        memberIndex === index ? updateMemberField(member, field, value) : member
      ),
    }));
    setFormError('');
    if (field === 'registerNumber' && isBlockedRegisterNumber(value)) {
      markBlockedRegister(index);
    }
  }

  function handleReview(event) {
    event.preventDefault();
    const blockedIndex = findBlockedRegisterIndex(draft.members);
    if (blockedIndex >= 0) {
      markBlockedRegister(blockedIndex);
      return;
    }
    const errors = validateRegistrationForm(draft.teamName, draft.members);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError(errors.members || 'Check the highlighted fields and try again.');
      setReviewing(false);
      return;
    }
    setFormError('');
    setReviewing(true);
  }

  async function handleContinueToPayment() {
    const blockedIndex = findBlockedRegisterIndex(draft.members);
    if (blockedIndex >= 0) {
      markBlockedRegister(blockedIndex);
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const payload = toRegistrationPayload(draft.teamName, draft.members);
      const result = await createRegistration({
        ...payload,
        paymentMode,
      });
      const registration = result.data;
      if (!registration?.id) {
        throw new Error('Registration was created, but payment cannot start yet.');
      }
      update({ registration, submitted: true });

      if (paymentMode === 'CASH') {
        navigate(ROUTES.ADMIN_REGISTRATIONS);
        return;
      }

      navigate(ROUTES.REGISTER_PAYMENT);
    } catch (error) {
      setFieldErrors(fieldErrorsFromApi(error.details));
      if (error.code === API_ERROR_CODES.BLOCKED_REGISTER_NUMBER) {
        markBlockedRegister(findBlockedRegisterIndex(draft.members));
      } else {
        setFormError(getErrorMessage(error));
        setReviewing(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="register-page">
      <p className="eyebrow">Admin tools</p>
      <h1 className="heading-serif">Add Teams</h1>
      <p className="lede">
        Create a registration entry on behalf of a team. This follows the same participant form used by
        the public registration page.
      </p>

      {reviewing ? (
        <>
          <RegistrationSummary teamName={draft.teamName} members={draft.members} />

          <div className="register-form__bar" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Payment mode</span>
              <select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)}>
                <option value="ONLINE">Online payment</option>
                <option value="CASH">Cash / pay to admin</option>
              </select>
            </label>
          </div>

          <div className="register-form__bar">
            <button type="button" className="btn btn--secondary" onClick={() => setReviewing(false)}>
              Edit details
            </button>
            <button type="button" className="btn" onClick={handleContinueToPayment} disabled={submitting}>
              {submitting
                ? 'Creating registration…'
                : paymentMode === 'CASH'
                  ? 'Register and mark as paid'
                  : 'Continue to payment'}
            </button>
          </div>
          {formError ? (
            <p className="form-error" role="alert">
              {formError}
            </p>
          ) : null}
        </>
      ) : (
        <>
          <form className="register-form" onSubmit={handleTeamSubmit} noValidate>
            <FormInput
              id="teamName"
              label="Team name"
              value={draft.teamName}
              error={teamErrors.teamName}
              maxLength={80}
              autoComplete="organization"
              required
              onChange={(value) => {
                update({ teamName: value, submitted: false, registration: null });
                setTeamErrors((current) => ({ ...current, teamName: '' }));
              }}
            />
            <SelectInput
              id="memberCount"
              label="Number of team members"
              value={String(draft.memberCount)}
              error={teamErrors.memberCount}
              onChange={(value) => {
                update({
                  memberCount: Number(value),
                  submitted: false,
                  registration: null,
                });
                setTeamErrors((current) => ({ ...current, memberCount: '' }));
              }}
            >
              {memberOptions.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </SelectInput>

            <div className="register-form__bar">
              <Link className="btn btn--secondary" to={ROUTES.ADMIN_DASHBOARD}>
                Back
              </Link>
              <button className="btn" type="submit">
                Continue
              </button>
            </div>
            {formError ? (
              <p className="form-error" role="alert">
                {formError}
              </p>
            ) : null}
          </form>

          {draft.members.length > 0 ? (
            <form className="register-form" onSubmit={handleReview} noValidate>
              {draft.members.map((member, index) => (
                <ParticipantForm
                  key={member.id}
                  member={member}
                  index={index}
                  errors={fieldErrors}
                  onChange={(field, value) => handleMemberChange(index, field, value)}
                />
              ))}
              <div className="register-form__bar">
                <button type="button" className="btn btn--secondary" onClick={() => setReviewing(false)}>
                  Edit team
                </button>
                <button className="btn" type="submit">
                  Review registration
                </button>
              </div>
              {formError ? (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              ) : null}
            </form>
          ) : null}
        </>
      )}

      {blockedNotice ? (
        <div className="modal-overlay">
          <div className="modal" role="dialog" aria-modal="true">
            <h2>Registration blocked</h2>
            <p>{BLOCKED_REGISTER_MESSAGE}</p>
            <div className="register-form__bar">
              <button className="btn" type="button" onClick={() => setBlockedNotice(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
