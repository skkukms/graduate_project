import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET!;

export function signToken(payload: { userId: number; email: string }) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET) as { userId: number; email: string };
}
