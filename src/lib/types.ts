export type Transaction = {
  id: string;
  user_id: string;
  date: string;
  category: string;
  amount: number;
  memo: string;
  tags: string[];
  created_at: string;
};

export type MonthlyTransaction = {
  date: string;
  category: string;
  amount: number;
  memo: string;
  tags: string[];
};

export type CategorySummary = {
  category: string;
  total: number;
};

export type TagSummary = {
  tag: string;
  total: number;
}; 