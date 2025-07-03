'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Transaction, CategorySummary } from '@/lib/types';

type Props = {
  month: string; // YYYY-MM
};

export default function MonthlyTransactions({ month }: Props) {
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', month],
    queryFn: async () => {
      const response = await fetch(`/api/transactions?month=${month}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!transactions?.length) {
    return <div>No transactions found for this month.</div>;
  }

  // 카테고리별 합계 계산
  const categorySummary = transactions.reduce<CategorySummary[]>(
    (acc, curr) => {
      const existing = acc.find((item) => item.category === curr.category);
      if (existing) {
        existing.total += curr.amount;
      } else {
        acc.push({ category: curr.category, total: curr.amount });
      }
      return acc;
    },
    [],
  );

  return (
    <div className="space-y-8">
      {/* 카테고리별 지출 차트 */}
      <div className="h-[400px]">
        <h2 className="text-xl font-semibold mb-4">카테고리별 지출</h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categorySummary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" name="지출액" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 거래 내역 테이블 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">거래 내역</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  날짜
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  분류
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  메모
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.amount.toLocaleString()}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.memo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
