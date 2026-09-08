import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';

import { User } from '../models/user.js';
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
