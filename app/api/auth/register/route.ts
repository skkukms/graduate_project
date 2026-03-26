import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: '이메일과 비밀번호를 입력하세요.' }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);

  const conn = await pool.getConnection();
  try {
    const [result]: any = await conn.execute(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email, hash, name ?? null]
    );
    const userId = result.insertId;

    // 계좌 자동 생성
    await conn.execute('INSERT INTO accounts (user_id) VALUES (?)', [userId]);

    const token = signToken({ userId, email });
    const res = NextResponse.json({ ok: true });
    res.cookies.set('token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return res;
  } catch (e: any) {
    if (e.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 });
    }
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  } finally {
    conn.release();
  }
}
