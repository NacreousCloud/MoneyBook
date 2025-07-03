import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 타입 정의
export type Transaction = {
  id: string;
  user_id: string;
  date: string;
  category: string;
  amount: number;
  memo: string;
  created_at: string;
};

export type Stock = {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  avg_price: number;
  created_at: string;
};

export type FixedExpense = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  day_of_month: number;
  created_at: string;
};

export type Loan = {
  id: string;
  user_id: string;
  bank: string;
  product: string;
  rate: number;
  period: number;
  amount: number;
  maturity_date: string;
  created_at: string;
};
