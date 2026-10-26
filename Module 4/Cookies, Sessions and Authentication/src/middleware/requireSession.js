const prisma = require('../db/prisma');
const sessionStore = require('../session/sessionStore');

module.exports = async function requireSession(req, res, next) {
  const sessionId = req.signedCookies.sid;
  if (typeof sessionId !== 'string') {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  try {
    const session = sessionStore.get(sessionId);
    if (!session) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      sessionStore.destroy(sessionId);
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
