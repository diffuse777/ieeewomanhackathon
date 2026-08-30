const blockedRepo = require('../repositories/blockedRegisterRepository');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

async function listBlocked(req, res) {
  const docs = await blockedRepo.listAll();
  return sendSuccess(res, { message: 'Blocked register numbers', data: docs });
}

async function blockNumber(req, res) {
  const { registerNumber, reason } = req.body || {};
  if (!registerNumber || typeof registerNumber !== 'string') {
    return sendError(res, { statusCode: 400, code: 'BAD_REQUEST', message: 'registerNumber is required' });
  }

  const exists = await blockedRepo.exists(registerNumber);
  if (exists) {
    return sendError(res, { statusCode: 409, code: 'CONFLICT', message: 'Register number already blocked' });
  }

  const created = await blockedRepo.create({ registerNumber, reason, createdBy: req.auth?.adminId || null });
  return sendSuccess(res, { message: 'Blocked', data: created });
}

async function unblockNumber(req, res) {
  const { idOrKey } = req.params;
  if (!idOrKey) {
    return sendError(res, { statusCode: 400, code: 'BAD_REQUEST', message: 'identifier is required' });
  }

  // allow deleting by registerNumber
  const removed = await blockedRepo.removeByKey(idOrKey);
  if (!removed) {
    return sendError(res, { statusCode: 404, code: 'NOT_FOUND', message: 'Blocked number not found' });
  }

  return sendSuccess(res, { message: 'Unblocked', data: removed });
}

async function unblockAll(req, res) {
  const result = await blockedRepo.removeAll();
  return sendSuccess(res, { message: 'All blocked register numbers removed', data: { deletedCount: result.deletedCount } });
}

async function getBlocked(req, res) {
  const { idOrKey } = req.params;
  if (!idOrKey) {
    return sendError(res, { statusCode: 400, code: 'BAD_REQUEST', message: 'identifier is required' });
  }

  const doc = await blockedRepo.findByKey(idOrKey);
  if (!doc) {
    return sendError(res, { statusCode: 404, code: 'NOT_FOUND', message: 'Blocked number not found' });
  }

  return sendSuccess(res, { message: 'Found', data: doc });
}

module.exports = {
  listBlocked: asyncHandler(listBlocked),
  blockNumber: asyncHandler(blockNumber),
  getBlocked: asyncHandler(getBlocked),
  unblockNumber: asyncHandler(unblockNumber),
  unblockAll: asyncHandler(unblockAll),
};
