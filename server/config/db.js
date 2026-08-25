const dns = require('dns');
const mongoose = require('mongoose');
const logger = require('./logger');
const {
  REQUIRED_MONGO_DB_NAME,
  withForcedMongoDbName,
  assertAllowedMongoDbName,
  assertConnectedToRequiredDatabase,
} = require('../utils/mongoDbName');

if (process.env.VERCEL && typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

mongoose.plugin(function lockHackathonRegistrationDatabase(schema) {
  const guard = function lockDatabaseWrite() {
    assertConnectedToRequiredDatabase(mongoose.connection);
  };

  schema.pre('save', guard);
  schema.pre('insertMany', guard);
  schema.pre(
    [
      'updateOne',
      'updateMany',
      'findOneAndUpdate',
      'findOneAndReplace',
      'findOneAndDelete',
      'deleteOne',
      'deleteMany',
      'replaceOne',
      'bulkWrite',
    ],
    guard
  );
});

let listenersBound = false;

function bindConnectionListeners() {
  if (listenersBound) {
    return;
  }

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established', {
      database: mongoose.connection.name,
      requiredDatabase: REQUIRED_MONGO_DB_NAME,
    });
  });

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error', { error: error.message });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  listenersBound = true;
}

function connectOptions() {
  return {
    dbName: REQUIRED_MONGO_DB_NAME,
    serverSelectionTimeoutMS: process.env.VERCEL ? 4000 : 15000,
    connectTimeoutMS: process.env.VERCEL ? 4000 : 15000,
    socketTimeoutMS: 15000,
    maxPoolSize: process.env.VERCEL ? 1 : 10,
    minPoolSize: 0,
    ...(process.env.VERCEL ? { family: 4 } : {}),
  };
}

async function rejectIfWrongDatabase() {
  try {
    assertConnectedToRequiredDatabase(mongoose.connection);
  } catch (error) {
    const actual = mongoose.connection.db?.databaseName || mongoose.connection.name;
    await mongoose.disconnect();
    throw new Error(
      `Connected to database "${actual}" but only "${REQUIRED_MONGO_DB_NAME}" is allowed. ${error.message}`
    );
  }
}

async function connectDB(mongoUri, options = {}) {
  mongoose.set('strictQuery', true);
  mongoose.set('bufferCommands', !process.env.VERCEL);
  bindConnectionListeners();

  if (!process.env.VERCEL) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }

  if (options.dbName) {
    assertAllowedMongoDbName(options.dbName);
  }

  const forcedUri = withForcedMongoDbName(mongoUri, REQUIRED_MONGO_DB_NAME);
  const opts = connectOptions();

  if (mongoose.connection.readyState === 1) {
    if (mongoose.connection.name !== REQUIRED_MONGO_DB_NAME) {
      await mongoose.disconnect();
    } else {
      return mongoose.connection;
    }
  }

  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    if (mongoose.connection.name !== REQUIRED_MONGO_DB_NAME) {
      await mongoose.disconnect();
    } else {
      return mongoose.connection;
    }
  }

  try {
    await mongoose.connect(forcedUri, opts);
  } catch (error) {
    const message = String(error?.message || '');
    const srvFailed = /querySrv|ECONNREFUSED|ENOTFOUND|ETIMEOUT|queryTxt/i.test(message);

    if (!process.env.VERCEL && srvFailed) {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
      logger.warn('MongoDB SRV lookup failed; retrying with public DNS');
      await mongoose.connect(forcedUri, opts);
    } else {
      throw error;
    }
  }

  await rejectIfWrongDatabase();
  return mongoose.connection;
}

async function ensureDatabaseIndexes() {
  assertConnectedToRequiredDatabase(mongoose.connection);

  const Registration = require('../models/Registration');
  const Admin = require('../models/Admin');
  const RevokedToken = require('../models/RevokedToken');

  await Promise.all([Registration.syncIndexes(), Admin.syncIndexes(), RevokedToken.syncIndexes()]);

  logger.info('MongoDB indexes synchronized', {
    database: mongoose.connection.name,
    collections: ['registrations', 'admins', 'revokedtokens'],
  });
}

async function disconnectDB() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
}

module.exports = { connectDB, disconnectDB, ensureDatabaseIndexes };
