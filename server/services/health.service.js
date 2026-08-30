const mongoose = require('mongoose');
const { REQUIRED_MONGO_DB_NAME, connectedDatabaseName } = require('../utils/mongoDbName');
const RegistrationLimit = require('../models/RegistrationLimit');
const registrationRepository = require('../repositories/registrationRepository');

function getHealthStatus() {
  const database = connectedDatabaseName(mongoose.connection) || null;
  const databaseReadyState = mongoose.connection?.readyState ?? 0;
  const lockedToRequiredDatabase =
    databaseReadyState === 1 && database === REQUIRED_MONGO_DB_NAME;

  return {
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database,
    requiredDatabase: REQUIRED_MONGO_DB_NAME,
    databaseReadyState,
    lockedToRequiredDatabase,
    // include registration window info for public clients
    registrationWindow: null,
  };
}

async function getHealthStatus() {
  const base = getHealthStatusSync();

  try {
    const limitDoc = await RegistrationLimit.findOne().lean();
    if (limitDoc) {
      const now = new Date();
      const startAt = limitDoc.startAt ? new Date(limitDoc.startAt) : null;
      const endAt = limitDoc.endAt ? new Date(limitDoc.endAt) : null;
      const currentCount = await registrationRepository.countByFilter({ paymentStatus: { $in: ['PENDING','PAID'] } });
      const open = (!startAt || startAt <= now) && (!endAt || endAt > now) && (typeof limitDoc.limit !== 'number' || currentCount < limitDoc.limit);

      base.registrationWindow = {
        startAt: startAt ? startAt.toISOString() : null,
        endAt: endAt ? endAt.toISOString() : null,
        limit: typeof limitDoc.limit === 'number' ? limitDoc.limit : null,
        currentCount,
        open,
      };
    }
  } catch (err) {
    // ignore registration info failures for health
  }

  return base;
}

// keep original synchronous signature name for compatibility
function getHealthStatusSync() {
  const database = connectedDatabaseName(mongoose.connection) || null;
  const databaseReadyState = mongoose.connection?.readyState ?? 0;
  const lockedToRequiredDatabase =
    databaseReadyState === 1 && database === REQUIRED_MONGO_DB_NAME;

  return {
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database,
    requiredDatabase: REQUIRED_MONGO_DB_NAME,
    databaseReadyState,
    lockedToRequiredDatabase,
    registrationWindow: null,
  };
}

module.exports = { getHealthStatus };
