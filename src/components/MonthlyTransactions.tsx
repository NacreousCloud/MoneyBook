'use client';

import { useEffect, useState } from 'react';
import TransactionForm from './TransactionForm';
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
  setMonth: (month: string) => void;
};

export default function MonthlyTransactions({ month, setMonth }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // 최초 로딩 시 API로 월별 거래 내역 불러오기
  useEffect(() => {
    setLoading(true);
    fetch(`/api/transactions?month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        setTransactions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setTransactions([]);
        setLoading(false);
      });
  }, [month]);

  // 거래 추가 핸들러
  const handleAddTransaction = (newTransaction: Transaction) => {
    setTransactions((prev) => [newTransaction, ...prev]);
    // 입력한 거래의 날짜로 월 이동
    const date = new Date(newTransaction.date);
    const newMonth = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}`;
    if (newMonth !== month) {
      setMonth(newMonth);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* 왼쪽: 거래 입력 + 거래 내역 테이블 */}
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            거래 내역 입력
          </h2>
          <TransactionForm onAdd={handleAddTransaction} />
        </div>
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
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center">
                      거래 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
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
      </div>
      {/* 오른쪽: 카테고리별 지출 차트 및 합계 표 */}
      <div className="h-[400px] flex flex-col">
        <h2 className="text-xl font-semibold mb-4">카테고리별 지출</h2>
        <div className="flex-1">
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
        {/* 카테고리별 합계 표 */}
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-2">카테고리별 합계</h3>
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">카테고리</th>
                <th className="px-4 py-2 text-right">합계</th>
              </tr>
            </thead>
            <tbody>
              {categorySummary.map((item) => (
                <tr key={item.category}>
                  <td className="px-4 py-2">{item.category}</td>
                  <td className="px-4 py-2 text-right">
                    {item.total.toLocaleString()}원
                  </td>
                </tr>
              ))}
              <tr className="font-bold bg-gray-100">
                <td className="px-4 py-2">전체 합계</td>
                <td className="px-4 py-2 text-right">
                  {categorySummary
                    .reduce((sum, item) => sum + item.total, 0)
                    .toLocaleString()}
                  원
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
