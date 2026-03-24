import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const [rows]: any = await pool.execute(
    'SELECT id, password_hash FROM users WHERE email = ?',
    [email]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: '이메일 또는 비밀번호가 틀렸습니다.' }, { status: 401 });
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return NextResponse.json({ error: '이메일 또는 비밀번호가 틀렸습니다.' }, { status: 401 });
  }

  const token = signToken({ userId: user.id, email });

  const res = NextResponse.json({ ok: true });
  res.cookies.set('token', token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7일
    path: '/',
  });
  return res;
}
