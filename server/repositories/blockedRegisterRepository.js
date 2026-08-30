const Blocked = require('../models/BlockedRegisterNumber');

function normalizeKey(value) {
  return String(value || '').trim().toUpperCase().replace(/[\s/_-]+/g, '');
}

async function listAll() {
  return Blocked.find().sort({ createdAt: -1 }).lean();
}

async function findByKey(registerNumber) {
  if (!registerNumber) return null;
  const key = normalizeKey(registerNumber);
  return Blocked.findOne({ registerNumber: key }).lean();
}

async function exists(registerNumber) {
  const doc = await findByKey(registerNumber);
  return Boolean(doc);
}

async function create({ registerNumber, reason = null, createdBy = null }) {
  const key = normalizeKey(registerNumber);
  return Blocked.create({ registerNumber: key, reason, createdBy });
}

async function removeByKey(registerNumber) {
  const key = normalizeKey(registerNumber);
  return Blocked.findOneAndDelete({ registerNumber: key });
}

async function removeAll() {
  return Blocked.deleteMany({});
}

module.exports = {
  listAll,
  findByKey,
  exists,
  create,
  removeByKey,
  removeAll,
};
