export type Transaction = {
  id: string;
  user_id: string;
  date: string;
  category: string;
  amount: number;
  memo: string;
  created_at: string;
};

export type MonthlyTransaction = {
  date: string;
  category: string;
  amount: number;
  memo: string;
};

export type CategorySummary = {
  category: string;
  total: number;
}; 