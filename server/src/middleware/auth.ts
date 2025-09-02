import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return secret;
};

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'] || '';
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = parts[1];
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { userId: string };
    req.userId = payload.userId;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
