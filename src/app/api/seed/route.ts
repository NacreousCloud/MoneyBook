import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const testData = [
  {
    date: '2024-06-01',
    category: '식비',
    amount: 15000,
    memo: '점심 식사',
    user_id: '1',
  },
  {
    date: '2024-06-05',
    category: '교통비',
    amount: 5000,
    memo: '지하철',
    user_id: '1',
    },
  {
    date: '2024-06-10',
    category: '주거비',
    amount: 500000,
    memo: '월세',
    user_id: '1',
  },
];

export async function POST() {
  const { data, error } = await supabase
    .from('transactions')
    .insert(testData)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}