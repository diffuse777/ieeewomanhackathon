const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../utils/constants');
const { loadEnv } = require('../config/env');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateAdminLogin(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Invalid request body', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  let identifier = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!identifier && typeof body.username === 'string') {
    identifier = body.username.trim().toLowerCase();
  }
  const password = typeof body.password === 'string' ? body.password : '';
  const envIdentifier = String(loadEnv().admin.email).trim().toLowerCase();

  if (!identifier || identifier === 'admin' || identifier === 'admin@example.com') {
    identifier = envIdentifier || 'admin@example.com';
  }

  const isEmailLike = EMAIL_PATTERN.test(identifier);
  const isUsernameLike = /^[A-Za-z0-9._-]+$/.test(identifier);

  if (!identifier || (!isEmailLike && !isUsernameLike) || !password) {
    throw new AppError('Email and password are required', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  return { email: identifier, password };
}

module.exports = { validateAdminLogin };
