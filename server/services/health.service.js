const mongoose = require('mongoose');
const { REQUIRED_MONGO_DB_NAME, connectedDatabaseName } = require('../utils/mongoDbName');

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
  };
}

module.exports = { getHealthStatus };
