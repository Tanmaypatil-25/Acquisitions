import { jwttoken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';
import logger from '#config/logger.js';

export const authenticateToken = (req, res, next) => {
  try {
    let token = cookies.get(req, 'token');

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const decoded = jwttoken.verify(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
};

export const requireRole = (roles = []) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `Access denied for user ${req.user.id} with role '${req.user.role}'. Required roles: [${allowedRoles.join(', ')}]`
      );
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action',
      });
    }

    next();
  };
};
