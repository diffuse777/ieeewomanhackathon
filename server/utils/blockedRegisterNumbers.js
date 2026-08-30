const blockedRepository = require('../repositories/blockedRegisterRepository');

function normalizeRegisterNumberKey(value) {
  return String(value || '').trim().toUpperCase().replace(/[\s/_-]+/g, '');
}

const BLOCKED_REGISTER_MESSAGE = 'The entered register number is blocked by the administrator.';

async function isBlockedRegisterNumber(value) {
  if (!value) return false;
  const key = normalizeRegisterNumberKey(value);
  if (!key) return false;
  return blockedRepository.exists(key);
}

async function findBlockedMembers(members = []) {
  if (!Array.isArray(members) || members.length === 0) return [];
  const checks = members.map((member, index) => ({ index, registerNumber: member?.registerNumber }));
  const blocked = [];
  for (const item of checks) {
    if (item.registerNumber && (await isBlockedRegisterNumber(item.registerNumber))) {
      blocked.push(item);
    }
  }
  return blocked;
}

module.exports = {
  BLOCKED_REGISTER_MESSAGE,
  isBlockedRegisterNumber,
  findBlockedMembers,
};
