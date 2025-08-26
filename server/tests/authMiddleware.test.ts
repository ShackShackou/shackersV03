import jwt from 'jsonwebtoken';
import { requireAuth, AuthRequest } from '../src/middleware/auth';

describe('requireAuth middleware', () => {
  const userId = 'user-123';
  const secret = process.env.JWT_SECRET || 'dev-secret';

  it('calls next and attaches userId for a valid token', () => {
    const token = jwt.sign({ userId }, secret);
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(req.userId).toBe(userId);
    expect(next).toHaveBeenCalled();
  });

  it('returns 401 for an invalid token', () => {
    const req = { headers: { authorization: 'Bearer invalid' } } as AuthRequest;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });
});
