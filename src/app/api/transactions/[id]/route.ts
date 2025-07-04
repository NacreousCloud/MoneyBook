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

// PUT /api/transactions/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user_id = getUserIdFromRequest(req);
  if (!user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = params;
  const body = await req.json();
  const { data, error } = await supabase
    .from('transactions')
    .update({ ...body, user_id })
    .eq('id', id)
    .eq('user_id', user_id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// DELETE /api/transactions/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user_id = getUserIdFromRequest(req);
  if (!user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = params;
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 