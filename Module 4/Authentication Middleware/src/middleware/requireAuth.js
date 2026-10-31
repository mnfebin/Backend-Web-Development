// 2. Extracts the Bearer token using a strict regex:
//      /^Bearer ([^\s]+)$/i
//    If the regex does not match, token = null.
//
// 3. Returns 401 immediately if token is null:
//      res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } })
//
// 4. Calls jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }) inside a try block.
//    On success:
//      - Set req.user = the verified payload
//      - Call next()
//
// 5. In the catch block, returns the same generic 401 response for every error type.
//    Do NOT distinguish TokenExpiredError from JsonWebTokenError in the client response.
//
// ─────────────────────────────────────────────────────────────────────────────
// const jwt = require('jsonwebtoken');  ← uncomment when you start implementing

const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization ?? '';
  const match = authHeader.match(/^Bearer\s+(\S+)$/);
  const token = match ? match[1] : null;

  if (!token) {
    return res.status(401).json({
      error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({
      error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
    });
  }
};
