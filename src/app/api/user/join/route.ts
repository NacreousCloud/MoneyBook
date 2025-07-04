import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_CATEGORIES = ['식비', '교통비', '주거비', '통신비', '기타'];

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'email, password required' }, { status: 400 });
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  // 회원가입 성공 시 기본 카테고리 생성
  const user_id = data.user?.id;
  if (user_id) {
    await supabase.from('categories').insert(
      DEFAULT_CATEGORIES.map((name) => ({ name, user_id }))
    );
  }
  return NextResponse.json(data);
} 