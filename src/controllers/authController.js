import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import fs from 'node:fs/promises';
import path from 'node:path';
import Handlebars from 'handlebars';
import { fileURLToPath } from 'node:url';
import { User } from '../models/user.js';
import { sendEmail } from '../utils/sendMail.js';
import { Session } from '../models/session.js';

import {
  createSession,
  setSessionCookies,
} from '../services/auth.js';

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      throw createHttpError(400, 'Email in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
    });

    const session = await createSession(user._id);

    setSessionCookies(res, session);

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      throw createHttpError(
        401,
        'Invalid credentials',
      );
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordCorrect) {
      throw createHttpError(
        401,
        'Invalid credentials',
      );
    }

    await Session.deleteMany({
      userId: user._id,
    });

    const session = await createSession(user._id);

    setSessionCookies(res, session);

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const refreshUserSession = async (
req,
res,
next,
) => {
try {
const { sessionId, refreshToken } = req.cookies;

const session = await Session.findOne({
  _id: sessionId,
  refreshToken,
});

if (!session) {
  throw createHttpError(
    401,
    'Session not found',
  );
}

if (
  session.refreshTokenValidUntil <
  new Date()
) {
  await Session.deleteOne({
    _id: session._id,
  });

  res.clearCookie('sessionId');
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  throw createHttpError(
    401,
    'Session token expired',
  );
}

await Session.deleteOne({
  _id: session._id,
});

const newSession = await createSession(
  session.userId,
);

setSessionCookies(res, newSession);

res.status(200).json({
  message: 'Session refreshed',
});

} catch (error) {
next(error);
}
};

export const logoutUser = async (
  req,
  res,
  next,
) => {
  try {
    const { sessionId } = req.cookies;

    if (sessionId) {
      await Session.deleteOne({
        _id: sessionId,
      });
    }

    res.clearCookie('sessionId');
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const requestResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message: 'Password reset email sent successfully',
      });
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '15m',
      },
    );

    const frontendDomain = process.env.FRONTEND_DOMAIN;

    const resetLink = `${frontendDomain}/reset-password?token=${token}`;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const templatePath = path.join(
      __dirname,
      '../templates/reset-password-email.html',
    );

    const templateSource = await fs.readFile(templatePath, 'utf-8');

    const template = Handlebars.compile(templateSource);

    const html = template({
      name: user.username || user.email,
      link: resetLink,
    });

    try {
     await sendEmail({
  from: process.env.SMTP_FROM,
  to: email,
  subject: "Reset your password",
  html,
});
    } catch {
      return next(
        createHttpError(
          500,
          'Failed to send the email, please try again later.',
        ),
      );
    }

    return res.status(200).json({
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    let payload;

    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return next(createHttpError(401, 'Invalid or expired token'));
    }

    const { sub, email } = payload;

    const user = await User.findOne({
      _id: sub,
      email,
    });

    if (!user) {
      return next(createHttpError(404, 'User not found'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};
