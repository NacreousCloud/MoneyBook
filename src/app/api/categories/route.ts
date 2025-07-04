import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET: 카테고리 목록 조회
export async function GET(req: NextRequest) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST: 카테고리 추가
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, user_id } = body;
  if (!name || !user_id) {
    return NextResponse.json({ error: 'name, user_id required' }, { status: 400 });
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
  const body = await req.json();
  const { id, name } = body;
  if (!id || !name) {
    return NextResponse.json({ error: 'id, name required' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// DELETE: 카테고리 삭제
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 