const RegistrationLimit = require('../models/RegistrationLimit');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

async function getSettings(req, res) {
  const doc = await RegistrationLimit.findOne().lean();
  return sendSuccess(res, { message: 'Settings retrieved', data: doc || null });
}

async function updateSettings(req, res) {
  const { startAt, endAt, limit } = req.body || {};

  if (!startAt || !endAt || typeof limit !== 'number') {
    return sendError(res, { statusCode: 400, code: 'BAD_REQUEST', message: 'startAt, endAt and limit are required' });
  }

  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return sendError(res, { statusCode: 400, code: 'BAD_REQUEST', message: 'Invalid date format' });
  }

  const doc = await RegistrationLimit.findOneAndUpdate(
    {},
    { startAt: start, endAt: end, limit },
    { upsert: true, new: true }
  ).lean();

  return sendSuccess(res, { message: 'Settings updated', data: doc });
}

module.exports = {
  getSettings: asyncHandler(getSettings),
  updateSettings: asyncHandler(updateSettings),
};
