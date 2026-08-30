const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const healthService = require('../services/health.service');

const getHealth = asyncHandler(async (req, res) => {
  const data = await healthService.getHealthStatus();

  if (!data.lockedToRequiredDatabase) {
    return sendError(res, {
      statusCode: 503,
      code: 'DATABASE_NOT_LOCKED',
      message: `API is not locked to the ${data.requiredDatabase} database`,
      details: data,
    });
  }

  return sendSuccess(res, {
    message: 'Server is healthy',
    data,
  });
});

module.exports = { getHealth };
