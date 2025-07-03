'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

type Transaction = {
  id: string;
  date: string;
  category: string;
  amount: number;
  memo: string;
};

// 임시 데이터
const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2024-06-01',
    category: '식비',
    amount: 15000,
    memo: '점심 식사',
  },
  {
    id: '2',
    date: '2024-06-05',
    category: '교통비',
    amount: 5000,
    memo: '지하철',
  },
  {
    id: '3',
    date: '2024-06-10',
    category: '주거비',
    amount: 500000,
    memo: '월세',
  },
];

export default function TransactionList() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0',
    )}`;
  });

  // 임시로 mock 데이터 사용
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', selectedMonth],
    queryFn: async () => {
      const response = await fetch(`/api/transactions?month=${selectedMonth}`);
      return response.json();
    },
  });

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">거래 내역</h2>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>
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
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center">
                  Loading...
                </td>
              </tr>
            ) : (
              transactions?.map((transaction) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
