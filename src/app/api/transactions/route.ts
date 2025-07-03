import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/transactions?month=YYYY-MM
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const month = searchParams.get('month');

  if (!month) {
    return NextResponse.json(
      { error: 'Month parameter is required' },
      { status: 400 },
    );
  }

  const [year, monthNum] = month.split('-');
  const startDate = `${year}-${monthNum}-01`;
  const endDate = `${year}-${monthNum}-30`;

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) {
    console.log(error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/transactions
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabase
    .from('transactions')
    .insert([body])
    .select()
    .single();
console.log(error);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PUT /api/transactions/:id
export async function PUT(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').pop();
  const body = await req.json();

  const { data, error } = await supabase
    .from('transactions')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/transactions/:id
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').pop();

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
