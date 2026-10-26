const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../db/prisma');
const sessionStore = require('../session/sessionStore');
const requireSession = require('../middleware/requireSession');

const router = express.Router();
const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.COOKIE_SECURE === 'true',
  path: '/',
};

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({
        error: { code: 'INVALID_REQUEST', message: 'Email and password are required' },
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const sessionId = sessionStore.create(user.id);
    res.cookie('sid', sessionId, {
      ...cookieOptions,
      maxAge: sessionStore.ttlMs,
      signed: true,
    });
    return res.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireSession, (req, res) => res.json({ user: req.user }));

router.post('/logout', async (req, res, next) => {
  try {
    const sessionId = req.signedCookies.sid;
    if (typeof sessionId === 'string') sessionStore.destroy(sessionId);

    res.clearCookie('sid', cookieOptions);
    return res.json({ message: 'Logged out' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
