import logger from '#config/logger.js';
import {
  getAllUsers,
  getUserById as fetchUserById,
  updateUser as modifyUser,
  deleteUser as removeUser,
} from '#services/users.service.js';
import { userIdSchema, updateUserSchema } from '#validations/users.validation.js';
import { formatValidationError } from '#utils/format.js';
import { jwttoken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Getting users...');

    const allUsers = await getAllUsers();

    res.json({
      message: 'Successfully retrieved users',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const idValidation = userIdSchema.safeParse(req.params);
    if (!idValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(idValidation.error),
      });
    }

    const { id } = idValidation.data;
    logger.info(`Getting user by id: ${id}`);

    const user = await fetchUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'Successfully retrieved user',
      user,
    });
  } catch (error) {
    logger.error(`Error fetching user ${req.params?.id}:`, error);
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const idValidation = userIdSchema.safeParse(req.params);
    if (!idValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(idValidation.error),
      });
    }

    const bodyValidation = updateUserSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = idValidation.data;
    const updates = bodyValidation.data;

    // Resolve authenticated user from req.user (or fallback to token check)
    let currentUser = req.user;
    if (!currentUser) {
      const token = cookies.get(req, 'token') || (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.split(' ')[1]);
      if (token) {
        try {
          currentUser = jwttoken.verify(token);
          req.user = currentUser;
        } catch {
          // Token invalid, handled below
        }
      }
    }

    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    // Role-based authorization:
    // Only "admin" users can change the "role" of any user
    if (updates.role && currentUser.role !== 'admin') {
      logger.warn(`User ${currentUser.id} attempted to change role without admin privileges`);
      return res.status(403).json({ error: 'Forbidden', message: 'Only admin can change user roles' });
    }

    // Authenticated users can change only their own information (unless they are admin)
    const isOwner = Number(currentUser.id) === Number(id);
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      logger.warn(`User ${currentUser.id} attempted to update user ${id} without permission`);
      return res.status(403).json({ error: 'Forbidden', message: 'You can only update your own profile' });
    }

    logger.info(`Updating user ${id}...`);
    const updatedUser = await modifyUser(id, updates);

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error(`Error updating user ${req.params?.id}:`, error);

    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique')) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const idValidation = userIdSchema.safeParse(req.params);
    if (!idValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(idValidation.error),
      });
    }

    const { id } = idValidation.data;

    // Resolve authenticated user from req.user (or fallback to token)
    let currentUser = req.user;
    if (!currentUser) {
      const token = cookies.get(req, 'token') || (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.split(' ')[1]);
      if (token) {
        try {
          currentUser = jwttoken.verify(token);
          req.user = currentUser;
        } catch {
          // Token invalid, handled below
        }
      }
    }

    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    // Only self or admin can delete
    const isOwner = Number(currentUser.id) === Number(id);
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      logger.warn(`User ${currentUser.id} attempted to delete user ${id} without permission`);
      return res.status(403).json({ error: 'Forbidden', message: 'You can only delete your own account' });
    }

    logger.info(`Deleting user ${id}...`);
    const deletedUser = await removeUser(id);

    // If the user deleted their own account, clear their session cookie
    if (isOwner) {
      cookies.clear(res, 'token');
    }

    res.status(200).json({
      message: 'User deleted successfully',
      user: deletedUser,
    });
  } catch (error) {
    logger.error(`Error deleting user ${req.params?.id}:`, error);

    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(error);
  }
};
