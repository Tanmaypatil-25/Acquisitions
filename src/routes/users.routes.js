import express from 'express';
import {
  fetchAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '#controllers/users.controller.js';
import { authenticateToken, requireRole } from '#middleware/auth.middleware.js';

const router = express.Router();

// Protect all user routes with authenticateToken
router.use(authenticateToken);

// Admin-only: list all users
router.get('/', requireRole(['admin']), fetchAllUsers);

// Authenticated users: get user details by id
router.get('/:id', getUserById);

// Authenticated users: update user profile (role change restricted to admin)
router.put('/:id', updateUser);

// Admin-only: delete user
router.delete('/:id', requireRole(['admin']), deleteUser);

export default router;
