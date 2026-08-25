const REQUIRED_MONGO_DB_NAME = 'hackathon_registration';

function extractMongoDbName(mongoUri) {
  try {
    const normalized = String(mongoUri || '')
      .replace(/^mongodb\+srv:\/\//i, 'https://')
      .replace(/^mongodb:\/\//i, 'http://');
    const pathname = new URL(normalized).pathname || '';
    const name = pathname.replace(/^\//, '').split('/')[0];
    return decodeURIComponent(name || '');
  } catch {
    return '';
  }
}

function assertAllowedMongoDbName(dbName) {
  const name = String(dbName || '').trim();
  if (name !== REQUIRED_MONGO_DB_NAME) {
    throw new Error(
      `Only the "${REQUIRED_MONGO_DB_NAME}" database is allowed. Refusing "${name || 'unknown'}".`
    );
  }
  return REQUIRED_MONGO_DB_NAME;
}

/**
 * Force the MongoDB URI path to hackathon_registration.
 * Any other database name in the URI is rewritten; a URI that cannot be parsed is rejected.
 */
function withForcedMongoDbName(mongoUri, dbName = REQUIRED_MONGO_DB_NAME) {
  assertAllowedMongoDbName(dbName);

  const uri = String(mongoUri || '').trim();
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/[^/?]+)(?:\/[^?]*)?(\?.*)?$/i);
  if (!match) {
    throw new Error(
      `MONGODB_URI could not be locked to "${REQUIRED_MONGO_DB_NAME}". Check the connection string format.`
    );
  }

  return `${match[1]}/${REQUIRED_MONGO_DB_NAME}${match[2] || ''}`;
}

function connectedDatabaseName(connection) {
  return connection?.db?.databaseName || connection?.name || '';
}

function assertConnectedToRequiredDatabase(connection) {
  const name = connectedDatabaseName(connection);
  assertAllowedMongoDbName(name);
  return name;
}

module.exports = {
  REQUIRED_MONGO_DB_NAME,
  extractMongoDbName,
  withForcedMongoDbName,
  assertAllowedMongoDbName,
  connectedDatabaseName,
  assertConnectedToRequiredDatabase,
};
