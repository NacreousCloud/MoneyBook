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

// GET /api/transactions?month=YYYY-MM
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const month = searchParams.get('month');
  const user_id = getUserIdFromRequest(req);
  if (!user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!month) {
    return NextResponse.json(
      { error: 'Month parameter is required' },
      { status: 400 },
    )
  }
  const [year, monthNum] = month.split('-');
  const startDate = `${year}-${monthNum}-01`;
  const endDate = `${year}-${monthNum}-30`;
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user_id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST /api/transactions
export async function POST(req: NextRequest) {
  const user_id = getUserIdFromRequest(req);
  if (!user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { data, error } = await supabase
    .from('transactions')
    .insert([{ ...body, user_id }])
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// PUT /api/transactions/:id
export async function PUT(req: NextRequest) {
  const user_id = getUserIdFromRequest(req);
  if (!user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = req.nextUrl.pathname.split('/').pop();
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
export async function DELETE(req: NextRequest) {
  const user_id = getUserIdFromRequest(req);
  if (!user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = req.nextUrl.pathname.split('/').pop();
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
