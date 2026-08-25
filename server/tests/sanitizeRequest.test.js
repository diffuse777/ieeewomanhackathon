const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeMongoValue } = require('../middleware/sanitizeRequest');

describe('sanitizeMongoValue', () => {
  it('strips operator and prototype keys from nested payloads', () => {
    const clean = sanitizeMongoValue({
      teamName: 'Alpha',
      $gt: '',
      members: [{ name: 'A', $ne: null }],
      __proto__: { admin: true },
      'members.email': { $regex: '.*' },
    });

    assert.equal(clean.teamName, 'Alpha');
    assert.equal(clean.$gt, undefined);
    assert.equal(clean['members.email'], undefined);
    assert.deepEqual(clean.members, [{ name: 'A' }]);
    assert.equal(Object.prototype.admin, undefined);
  });
});
