const { randomBytes } = require('node:crypto');

const sessions = new Map();
const ttlMs = Number(process.env.SESSION_TTL_MS || 60 * 60 * 1000);

if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) {
  throw new Error('SESSION_TTL_MS must be a positive integer');
}

function create(userId) {
  const sessionId = randomBytes(32).toString('hex');
  sessions.set(sessionId, {
    userId,
    expiresAt: Date.now() + ttlMs,
  });
  return sessionId;
}

function get(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }

  return session;
}

function destroy(sessionId) {
  sessions.delete(sessionId);
}

module.exports = { create, get, destroy, ttlMs };
