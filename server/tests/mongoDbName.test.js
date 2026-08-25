const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  REQUIRED_MONGO_DB_NAME,
  withForcedMongoDbName,
  extractMongoDbName,
  assertAllowedMongoDbName,
} = require('../utils/mongoDbName');

describe('mongoDbName lock', () => {
  it('always rewrites the URI path to hackathon_registration', () => {
    const rewritten = withForcedMongoDbName(
      'mongodb+srv://user:pass@cluster.mongodb.net/some_other_db?retryWrites=true'
    );
    assert.equal(extractMongoDbName(rewritten), REQUIRED_MONGO_DB_NAME);
    assert.match(rewritten, /\/hackathon_registration\?retryWrites=true$/);
  });

  it('fills in hackathon_registration when the URI has no database path', () => {
    const rewritten = withForcedMongoDbName('mongodb+srv://user:pass@cluster.mongodb.net');
    assert.equal(extractMongoDbName(rewritten), REQUIRED_MONGO_DB_NAME);
  });

  it('rejects any database name other than hackathon_registration', () => {
    assert.throws(() => assertAllowedMongoDbName('test'), /hackathon_registration/);
    assert.throws(() => withForcedMongoDbName('mongodb://localhost:27017/app', 'test'), /hackathon_registration/);
  });
});
