// src/routes/auth.routes.ts

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

/**
 * @swagger
 * tags:
 * - name: Auth
 * description: Organizer authentication
 */

/**
 * @swagger
 * /api/v1/auth/register:
 * post:
 * summary: Register a new organizer
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [email, password]
 * properties:
 * email:
 * type: string
 * format: email
 * password:
 * type: string
 * format: password
 * minLength: 8
 * responses:
 * 201:
 * description: Organizer created successfully
 * 400:
 * description: Validation failed
 * 409:
 * description: Email already exists
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 * post:
 * summary: Log in as an organizer
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [email, password]
 * properties:
 * email:
 * type: string
 * format: email
 * password:
 * type: string
 * format: password
 * responses:
 * 200:
 * description: Login successful, returns JWT
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * token:
 * type: string
 * 401:
 * description: Invalid email or password
 */
router.post('/login', validate(loginSchema), authController.login);

export default router;