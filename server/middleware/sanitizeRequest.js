function isUnsafeKey(key) {
  const name = String(key);
  return (
    name.startsWith('$') ||
    name.includes('.') ||
    name === '__proto__' ||
    name === 'prototype' ||
    name === 'constructor'
  );
}

function sanitizeMongoValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMongoValue(item));
  }

  if (value && typeof value === 'object') {
    const clean = {};

    Object.keys(value).forEach((key) => {
      if (isUnsafeKey(key)) {
        return;
      }
      clean[key] = sanitizeMongoValue(value[key]);
    });

    return clean;
  }

  return value;
}

function sanitizeRequest(req, _res, next) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    req.body = sanitizeMongoValue(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeMongoValue(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeMongoValue(req.params);
  }

  next();
}

module.exports = { sanitizeRequest, sanitizeMongoValue, isUnsafeKey };
