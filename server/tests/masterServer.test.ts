import { requireAuth, AuthRequest } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';

describe('requireAuth', () => {
  it('returns 401 if token is missing', () => {
    const req = { headers: {} } as AuthRequest;
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const res = { status, json } as any;
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and sets userId when token is valid', () => {
    const token = jwt.sign({ userId: '123' }, process.env.JWT_SECRET || 'dev-secret');
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const res = { status, json } as any;
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe('123');
  });
});
