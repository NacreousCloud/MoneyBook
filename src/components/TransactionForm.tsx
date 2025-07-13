'use client';

import { useEffect, useState } from 'react';
import type { Transaction } from '@/lib/types';

type TransactionFormData = {
  date: string;
  category: string;
  amount: number;
  memo: string;
  tags: string[];
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
    tags: [],
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(
    null,
  );
  const [tagInput, setTagInput] = useState('');

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

  // 태그 색상 생성 함수
  const getTagColor = (tag: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-gray-100 text-gray-800',
    ];
    const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // 태그 추가 함수
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData({ ...formData, tags: [...formData.tags, newTag] });
      }
      setTagInput('');
    }
  };

  // 태그 제거 함수
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

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
        tags: [],
      });
      setTagInput('');
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

        <div>
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-gray-700"
          >
            태그
          </label>
          <input
            type="text"
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="태그를 입력하고 Enter 또는 쉼표를 누르세요"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {formData.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-xs hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
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
