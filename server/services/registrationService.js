const registrationRepository = require('../repositories/registrationRepository');
const { validateCreateRegistration } = require('../validators/registrationValidator');
const { calculateRegistrationFee } = require('../utils/calculateRegistrationFee');
const { PAYMENT_STATUSES, ERROR_CODES } = require('../utils/constants');
const AppError = require('../utils/AppError');
const RegistrationLimit = require('../models/RegistrationLimit');

const ACTIVE_PAYMENT_STATUSES = [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PAID];

function toPublicRegistration(registration) {
  return {
    id: String(registration._id),
    teamName: registration.teamName,
    memberCount: registration.memberCount,
    totalAmount: registration.totalAmount,
    paymentStatus: registration.paymentStatus,
  };
}

function collectConflicts(existingRegistrations, registerNumbers, emails) {
  const registerSet = new Set(registerNumbers);
  const emailSet = new Set(emails);
  const conflictingRegisterNumbers = new Set();
  const conflictingEmails = new Set();

  existingRegistrations.forEach((registration) => {
    (registration.members || []).forEach((member) => {
      if (registerSet.has(member.registerNumber)) {
        conflictingRegisterNumbers.add(member.registerNumber);
      }
      if (emailSet.has(member.email)) {
        conflictingEmails.add(member.email);
      }
    });
  });

  return {
    registerNumbers: [...conflictingRegisterNumbers],
    emails: [...conflictingEmails],
  };
}

async function createRegistration(body) {
  const input = await validateCreateRegistration(body);
  const totalAmount = calculateRegistrationFee(input.memberCount);
  const paymentMode = String(body?.paymentMode || '').toUpperCase();
  const isCashPayment = paymentMode === 'CASH';

  // Enforce registration window and overall limit if configured
  const limitDoc = await RegistrationLimit.findOne().lean();
  if (limitDoc) {
    const now = new Date();
    if (limitDoc.startAt && new Date(limitDoc.startAt) > now) {
      throw new AppError('Registration is not open yet', 403, ERROR_CODES.FORBIDDEN);
    }

    if (limitDoc.endAt && new Date(limitDoc.endAt) <= now) {
      throw new AppError('Registration is closed', 403, ERROR_CODES.FORBIDDEN);
    }

    if (typeof limitDoc.limit === 'number') {
      const current = await registrationRepository.countByFilter({ paymentStatus: { $in: ACTIVE_PAYMENT_STATUSES } });
      if (current >= limitDoc.limit) {
        throw new AppError('Registration limit reached', 403, ERROR_CODES.FORBIDDEN);
      }
    }
  }

  const existing = await registrationRepository.findActiveByParticipantKeys({
    registerNumbers: input.members.map((member) => member.registerNumber),
    emails: input.members.map((member) => member.email),
  });

  if (existing.length > 0) {
    const conflicts = collectConflicts(
      existing,
      input.members.map((member) => member.registerNumber),
      input.members.map((member) => member.email)
    );

    throw new AppError(
      'One or more participants are already registered',
      409,
      ERROR_CODES.DUPLICATE_PARTICIPANT,
      [
        ...conflicts.registerNumbers.map((value) => ({
          field: 'members.registerNumber',
          message: `Register number ${value} is already registered`,
        })),
        ...conflicts.emails.map((value) => ({
          field: 'members.email',
          message: `Email ${value} is already registered`,
        })),
      ]
    );
  }

  const created = await registrationRepository.create({
    teamName: input.teamName,
    members: input.members,
    memberCount: input.memberCount,
    totalAmount,
    paymentStatus: isCashPayment ? PAYMENT_STATUSES.PAID : PAYMENT_STATUSES.PENDING,
    payment: {
      paymentOrderId: null,
      paymentTransactionId: isCashPayment ? `cash-${Date.now()}` : null,
      paymentStatus: isCashPayment ? PAYMENT_STATUSES.PAID : PAYMENT_STATUSES.PENDING,
      paidAt: isCashPayment ? new Date() : null,
    },
  });

  return toPublicRegistration(created);
}

module.exports = { createRegistration, toPublicRegistration };
