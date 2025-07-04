'use client';

import { useEffect, useState } from 'react';
import type { Transaction } from '@/lib/types';

type TransactionFormData = {
  date: string;
  category: string;
  amount: number;
  memo: string;
};

type Category = {
  id: string;
  name: string;
};

type Props = {
  onAdd?: (transaction: Transaction) => void;
};

export default function TransactionForm({ onAdd }: Props) {
  const [formData, setFormData] = useState<TransactionFormData>({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: 0,
    memo: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(
    null,
  );

  useEffect(() => {
    // 사용자별 카테고리 목록 불러오기
    const fetchCategories = async () => {
      setLoading(true);
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  // 메시지 자동 사라짐 처리
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
        setMessageType(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // API 호출로 거래 내역 저장
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save transaction');
      }

      const result = await response.json();
      // 폼 초기화
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: '',
        amount: 0,
        memo: '',
      });
      setMessage('거래 내역이 저장되었습니다.');
      setMessageType('success');
      if (onAdd) {
        onAdd(result);
      }
    } catch (error) {
      setMessage('저장 중 오류가 발생했습니다.');
      setMessageType('error');
    }
  };

  return (
    <>
      {/* 토스트 메시지 UI */}
      {message && (
        <div
          className={`fixed bottom-6 right-6 z-50 min-w-[200px] max-w-xs p-3 rounded shadow-lg text-sm font-medium transition-opacity duration-300
            ${
              messageType === 'success'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }
          `}
          style={{ pointerEvents: 'none' }}
        >
          {message}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded-lg shadow"
      >
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700"
          >
            날짜
          </label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            분류
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
            disabled={loading}
          >
            <option value="">선택하세요</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700"
          >
            금액
          </label>
          <input
            type="number"
            id="amount"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: Number(e.target.value) })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="memo"
            className="block text-sm font-medium text-gray-700"
          >
            메모
          </label>
          <input
            type="text"
            id="memo"
            value={formData.memo}
            onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          disabled={loading}
        >
          저장
        </button>
      </form>
    </>
  );
}
