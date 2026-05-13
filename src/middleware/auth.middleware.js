import { cookies } from '#utils/cookies.js';
import { jwttoken } from '#utils/jwt.js';

export const requireAuth = (req, res, next) => {
  const token = cookies.get(req, 'token');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    req.user = jwttoken.verify(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
