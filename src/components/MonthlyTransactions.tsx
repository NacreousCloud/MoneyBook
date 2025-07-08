'use client';

import { useEffect, useState, useRef } from 'react';
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
import * as XLSX from 'xlsx';

type Props = {
  month: string; // YYYY-MM
  setMonth: (month: string) => void;
};

export default function MonthlyTransactions({ month, setMonth }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction> | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(
    null,
  );
  const modalBgRef = useRef<HTMLDivElement>(null);
  const [excelRows, setExcelRows] = useState<any[]>([]);

  // 토스트 메시지 자동 사라짐
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
        setMessageType(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [message]);

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

  // 거래 수정 모달 열기
  const openEditModal = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setEditForm({ ...tx });
  };
  // 거래 수정 모달 닫기
  const closeEditModal = () => {
    setSelectedTransaction(null);
    setEditForm(null);
  };
  // 거래 수정 저장
  const handleEditSave = async () => {
    if (!editForm || !editForm.id) return;
    setEditLoading(true);
    try {
      const response = await fetch(`/api/transactions/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!response.ok) throw new Error('수정 실패');
      const updated = await response.json();
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === updated.id ? updated : tx)),
      );
      closeEditModal();
      setMessage('거래 내역이 수정되었습니다.');
      setMessageType('success');
    } catch {
      setMessage('수정 중 오류가 발생했습니다.');
      setMessageType('error');
    } finally {
      setEditLoading(false);
    }
  };

  // 엑셀 파일 업로드 및 파싱
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      setExcelRows(rows);
    };
    reader.readAsBinaryString(file);
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
      {/* 엑셀 업로드 버튼 */}
      <div className="col-span-2 mb-4">
        <label className="inline-block bg-indigo-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-indigo-700">
          엑셀 업로드
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
        </label>
      </div>
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
                    <tr
                      key={transaction.id}
                      className="cursor-pointer hover:bg-indigo-50"
                      onClick={() => openEditModal(transaction)}
                    >
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
      <div className="flex flex-col">
        <h2 className="text-xl font-semibold mb-4">카테고리별 지출</h2>
        <div style={{ height: 400 }}>
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

      {/* 거래 수정 모달 */}
      {selectedTransaction && editForm && (
        <div
          ref={modalBgRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          onClick={(e) => {
            if (e.target === modalBgRef.current) closeEditModal();
          }}
        >
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={closeEditModal}
            >
              ✕
            </button>
            <h2 className="text-lg font-bold mb-4">거래 수정</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  날짜
                </label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300"
                  value={editForm.date || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f!, date: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  분류
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300"
                  value={editForm.category || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f!, category: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  금액
                </label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300"
                  value={editForm.amount || 0}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f!,
                      amount: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  메모
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300"
                  value={editForm.memo || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f!, memo: e.target.value }))
                  }
                />
              </div>
              <button
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                onClick={handleEditSave}
                disabled={editLoading}
              >
                {editLoading ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
