'use client';

import MonthlyTransactions from '@/components/MonthlyTransactions';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import CategoryManager from '@/components/CategoryManager';
import { useState } from 'react';

export default function Home() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0',
    )}`;
  });
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          className="bg-indigo-500 text-white px-4 py-2 rounded shadow hover:bg-indigo-600"
          onClick={() => setShowCategoryManager(true)}
        >
          카테고리 관리
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            거래 내역 입력
          </h2>
          <TransactionForm />
        </div>
        <div>{/* <TransactionList /> */}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 월별 지출내역 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">월별 지출내역</h2>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <MonthlyTransactions month={selectedMonth} />
        </div>
      </div>
      {/* 카테고리 관리 모달 */}
      {showCategoryManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowCategoryManager(false)}
            >
              ✕
            </button>
            <CategoryManager />
          </div>
        </div>
      )}
    </div>
  );
}
