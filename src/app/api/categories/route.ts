import { supabase } from '@/lib/supabase';
import { decode } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

function getUserIdFromRequest(req: NextRequest) {
  const token = req.cookies.get('sb-access-token')?.value;
  if (!token) return null;
  try {
    const payload = decode(token);
    // supabase jwt: sub = user id
    // @ts-ignore
    return payload?.sub || null;
  } catch {
    return null;
  }
}

// GET: 카테고리 목록 조회
export async function GET(req: NextRequest) {
  const user_id = getUserIdFromRequest(req);
  if (!user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST: 카테고리 추가
export async function POST(req: NextRequest) {
  const user_id = getUserIdFromRequest(req);
  if (!user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { name } = body;
  if (!name) {
    return NextResponse.json({ error: 'name required' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, user_id }])
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// PUT: 카테고리 수정
export async function PUT(req: NextRequest) {
  const user_id = getUserIdFromRequest(req);
  if (!user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { id, name } = body;
  if (!id || !name) {
    return NextResponse.json({ error: 'id, name required' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
    .eq('user_id', user_id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// DELETE: 카테고리 삭제
export async function DELETE(req: NextRequest) {
  const user_id = getUserIdFromRequest(req);
  if (!user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 