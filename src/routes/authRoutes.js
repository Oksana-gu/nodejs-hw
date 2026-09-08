import { Router } from 'express';
import { celebrate, Segments } from 'celebrate';

import {
  registerUserSchema,
  loginUserSchema,
} from '../validations/authValidation.js';

import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
} from '../controllers/authController.js';

const router = Router();

router.post(
  '/register',
  celebrate({
    [Segments.BODY]: registerUserSchema,
  }),
  registerUser,
);

router.post(
  '/login',
  celebrate({
    [Segments.BODY]: loginUserSchema,
  }),
  loginUser,
);

router.post(
  '/refresh',
  refreshUserSession,
);

router.post(
  '/logout',
  logoutUser,
);

export default router;
