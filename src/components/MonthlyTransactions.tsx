'use client';

import type { CategorySummary, TagSummary, Transaction } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import * as XLSX from 'xlsx';
import TransactionForm from './TransactionForm';

type Props = {
  month: string; // YYYY-MM
  setMonth: (month: string) => void;
};

type Category = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
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
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [excelPreviewRows, setExcelPreviewRows] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategories, setNewCategories] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState('');
  const [excelTagInputs, setExcelTagInputs] = useState<{ [key: number]: string }>({});

  // 카테고리 목록 불러오기
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setCategories([]);
      });
    
  }, []);

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

  // 엑셀 행에 태그 추가
  const handleAddExcelTag = (rowIdx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = (excelTagInputs[rowIdx] || '').trim();
      if (newTag && !excelPreviewRows[rowIdx]?.tags?.includes(newTag)) {
        const updatedRows = excelPreviewRows.map((row, i) => 
          i === rowIdx ? { ...row, tags: [...(row.tags || []), newTag] } : row
        );
        setExcelPreviewRows(updatedRows);
        setExcelTagInputs(prev => ({ ...prev, [rowIdx]: '' }));
        
        // 신규 카테고리 목록 업데이트
        const allCategories = Array.from(new Set(updatedRows.map(row => row.category)));
        const newCats = allCategories.filter(cat => !isExistingCategory(cat));
        setNewCategories(newCats);
      }
    }
  };

  // 엑셀 행에서 태그 제거
  const handleRemoveExcelTag = (rowIdx: number, tagToRemove: string) => {
    const updatedRows = excelPreviewRows.map((row, i) => 
      i === rowIdx ? { ...row, tags: row.tags?.filter((tag: string) => tag !== tagToRemove) || [] } : row
    );
    setExcelPreviewRows(updatedRows);
    
    // 신규 카테고리 목록 업데이트
    const allCategories = Array.from(new Set(updatedRows.map(row => row.category)));
    const newCats = allCategories.filter(cat => !isExistingCategory(cat));
    setNewCategories(newCats);
  };

  // 거래 수정 모달 열기
  const openEditModal = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setEditForm({ ...tx });
    setEditTagInput('');
  };
  
  // 거래 수정 모달 닫기
  const closeEditModal = () => {
    setSelectedTransaction(null);
    setEditForm(null);
    setEditTagInput('');
  };

  // 수정 모달에서 태그 추가
  const handleAddEditTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = editTagInput.trim();
      if (newTag && editForm && !editForm.tags?.includes(newTag)) {
        setEditForm({
          ...editForm,
          tags: [...(editForm.tags || []), newTag],
        });
      }
      setEditTagInput('');
    }
  };

  // 수정 모달에서 태그 제거
  const handleRemoveEditTag = (tagToRemove: string) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        tags: editForm.tags?.filter(tag => tag !== tagToRemove) || [],
      });
    }
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

  // 거래 삭제
  const handleDeleteTransaction = async () => {
    if (!selectedTransaction || !selectedTransaction.id) return;
    
    if (!confirm('정말로 이 거래 내역을 삭제하시겠습니까?')) {
      return;
    }
    
    setEditLoading(true);
    try {
      const response = await fetch(`/api/transactions/${selectedTransaction.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('삭제 실패');
      
      setTransactions((prev) =>
        prev.filter((tx) => tx.id !== selectedTransaction.id)
      );
      closeEditModal();
      setMessage('거래 내역이 삭제되었습니다.');
      setMessageType('success');
    } catch {
      setMessage('삭제 중 오류가 발생했습니다.');
      setMessageType('error');
    } finally {
      setEditLoading(false);
    }
  };

  // 엑셀 날짜 시리얼 넘버 변환 함수
  function excelDateToString(excelDate: any) {
    if (typeof excelDate === 'number') {
      // 엑셀 시리얼 넘버를 KST(UTC+9) 기준 JS 날짜로 변환
      const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000) + 9 * 60 * 60 * 1000);
      return date.toISOString().slice(0, 10);
    }
    if (typeof excelDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(excelDate)) {
      return excelDate.slice(0, 10);
    }
    // 기타: 그대로 반환
    return excelDate;
  }
  // 엑셀 시간 시리얼 넘버 변환 함수
  function excelTimeToString(excelTime: any) {
    if (typeof excelTime === 'number') {
      // 엑셀 시리얼 넘버를 HH:mm으로 변환
      const totalSeconds = Math.round(excelTime * 24 * 60 * 60);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    if (typeof excelTime === 'string' && /^\d{2}:\d{2}/.test(excelTime)) {
      return excelTime.slice(0, 5);
    }
    return excelTime;
  }

  // 기존 카테고리인지 확인
  const isExistingCategory = (categoryName: string, currentCategories = categories) => {
    return currentCategories.some(cat => cat.name === categoryName);
  };

  // 신규 카테고리 추가
  const addNewCategory = async (categoryName: string) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName }),
      });
      if (!response.ok) throw new Error('카테고리 추가 실패');
      const newCategory = await response.json();
      
      // 카테고리 목록 업데이트
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      
      // 현재 엑셀 데이터에서 신규 카테고리 목록 다시 계산
      const uniqueCategories = Array.from(new Set(excelPreviewRows.map(row => row.category)));
      const newCats = uniqueCategories.filter(cat => !isExistingCategory(cat, updatedCategories));
      setNewCategories(newCats);
      
      setMessage(`카테고리 "${categoryName}"이 추가되었습니다.`);
      setMessageType('success');
    } catch {
      setMessage('카테고리 추가 중 오류가 발생했습니다.');
      setMessageType('error');
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

  // 엑셀 업로드 후 미리보기 모달 자동 오픈
  useEffect(() => {
    if (excelRows.length > 0) {
      // 컬럼 매핑: 날짜, 시간, 대분류+소분류→category, 금액, 메모 등
      const mapped = excelRows.map((row) => {
        const date = excelDateToString(row['날짜']);
        const time = excelTimeToString(row['시간']);
        const content = row['내용'].trim() || '';
        const memo = row['메모'].trim() || '';
        const tagsStr = row['태그'] || '';
        
        // 메모와 내용을 합친 전체 텍스트
        const fullText = content && memo ? `${content} ${memo}` : (content || memo);
        
        // 해시태그 추출 함수
        const extractHashtags = (text: string) => {
          const hashtagRegex = /#([^\s#]+)/g;
          const hashtags: string[] = [];
          let match;
          
          while ((match = hashtagRegex.exec(text)) !== null) {
            hashtags.push(match[1]);
          }
          
          return hashtags;
        };
        
        // 해시태그 제거 함수
        const removeHashtags = (text: string) => {
          return text.replace(/#([^\s#]+)/g, '').replace(/\s+/g, ' ').trim();
        };
        
        // 해시태그 추출
        const hashtagsFromText = extractHashtags(fullText);
        
        // 기존 태그와 해시태그 합치기
        const existingTags = tagsStr ? tagsStr.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [];
        const allTags = [...existingTags, ...hashtagsFromText];
        
        // 중복 제거
        const uniqueTags = Array.from(new Set(allTags));
        
        // 메모에서 해시태그 제거
        const cleanedMemo = removeHashtags(fullText);
        
        return {
          date,
          category: row['대분류'],
          amount: Number(row['금액'] || 0),
          memo: cleanedMemo,
          tags: uniqueTags,
          // time, // 필요시 추가
        };
      });
      setExcelPreviewRows(mapped);
      
      // 태그 입력 상태 초기화
      setExcelTagInputs({});
      
      // 신규 카테고리 찾기
      const uniqueCategories = Array.from(new Set(mapped.map(row => row.category)));
      const newCats = uniqueCategories.filter(cat => !isExistingCategory(cat));
      setNewCategories(newCats);
      
      setExcelModalOpen(true);
    }
  }, [excelRows]);

  // 엑셀 미리보기 행 수정
  const handleExcelEdit = (idx: number, key: string, value: any) => {
    const updatedRows = excelPreviewRows.map((row, i) => i === idx ? { ...row, [key]: value } : row);
    setExcelPreviewRows(updatedRows);
    
    // 카테고리 변경 시 신규 카테고리 목록 업데이트
    if (key === 'category') {
      const allCategories = Array.from(new Set(updatedRows.map(row => row.category)));
      const newCats = allCategories.filter(cat => !isExistingCategory(cat));
      setNewCategories(newCats);
    }
  };
  
  // 엑셀 미리보기 행 삭제
  const handleExcelDelete = (idx: number) => {
    const remainingRows = excelPreviewRows.filter((_, i) => i !== idx);
    setExcelPreviewRows(remainingRows);
    
    // 태그 입력 상태에서도 해당 행 제거
    const updatedTagInputs = { ...excelTagInputs };
    delete updatedTagInputs[idx];
    // 인덱스 재정렬
    const reindexedTagInputs: { [key: number]: string } = {};
    Object.keys(updatedTagInputs).forEach(key => {
      const numKey = parseInt(key);
      if (numKey > idx) {
        reindexedTagInputs[numKey - 1] = updatedTagInputs[numKey];
      } else {
        reindexedTagInputs[numKey] = updatedTagInputs[numKey];
      }
    });
    setExcelTagInputs(reindexedTagInputs);
    
    // 행 삭제 후 신규 카테고리 목록 업데이트
    const uniqueCategories = Array.from(new Set(remainingRows.map(row => row.category)));
    const newCats = uniqueCategories.filter(cat => !isExistingCategory(cat));
    setNewCategories(newCats);
  };
  
  // 엑셀 미리보기 모달 닫기
  const closeExcelModal = () => {
    setExcelModalOpen(false);
    setExcelRows([]);
    setExcelPreviewRows([]);
    setNewCategories([]);
    setExcelTagInputs({});
  };
  
  // 엑셀 일괄 저장
  const handleExcelSave = async () => {
    if (excelPreviewRows.length === 0) return;
    
    // 신규 카테고리가 있는 경우 경고
    if (newCategories.length > 0) {
      setMessage('신규 카테고리를 먼저 추가해주세요.');
      setMessageType('error');
      return;
    }
    
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(excelPreviewRows),
      });
      if (!response.ok) throw new Error('저장 실패');
      const result = await response.json();
      setMessage('엑셀 데이터가 저장되었습니다.');
      setMessageType('success');
      closeExcelModal();
      // 저장 후 새로고침
      setMonth(month);
    } catch {
      setMessage('엑셀 저장 중 오류가 발생했습니다.');
      setMessageType('error');
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

  // 태그별 합계 계산
  const tagSummary = transactions.reduce<TagSummary[]>((acc, curr) => {
    if (curr.tags && curr.tags.length > 0) {
      curr.tags.forEach(tag => {
        const existing = acc.find((item) => item.tag === tag);
        if (existing) {
          existing.total += curr.amount;
        } else {
          acc.push({ tag, total: curr.amount });
        }
      });
    }
    return acc;
  }, []);

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
          {/* 데스크톱 테이블 */}
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    분류
                  </th>
                  <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="w-48 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    태그
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    메모
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
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
                      <td className="px-4 py-4 text-sm text-gray-500 truncate">
                        {transaction.date}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 truncate">
                        {transaction.category}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 truncate">
                        {transaction.amount.toLocaleString()}원
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {transaction.tags && transaction.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-full">
                            {transaction.tags.slice(0, 4).map((tag, index) => (
                              <span
                                key={index}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)} whitespace-nowrap`}
                              >
                                {tag}
                              </span>
                            ))}
                            {transaction.tags.length > 4 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                +{transaction.tags.length - 4}
                              </span>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 truncate">
                        {transaction.memo}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 레이아웃 */}
          <div className="block md:hidden space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                거래 내역이 없습니다.
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-indigo-50"
                  onClick={() => openEditModal(transaction)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.category}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.date}
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-gray-900 mb-2">
                    {transaction.amount.toLocaleString()}원
                  </div>
                  {transaction.tags && transaction.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {transaction.tags.map((tag, index) => (
                        <span
                          key={index}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)} whitespace-nowrap`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {transaction.memo && (
                    <div className="text-sm text-gray-600 mt-2">
                      {transaction.memo}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </div>
      {/* 오른쪽: 카테고리별 지출 차트 및 합계 표 */}
      <div className="flex flex-col space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">카테고리별 지출</h2>
          <div style={{ height: 300 }}>
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
          <div className="mt-4">
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

        {/* 태그별 지출 합계 */}
        {tagSummary.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">태그별 지출</h2>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tagSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tag" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="지출액" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* 태그별 합계 표 */}
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">태그별 합계</h3>
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">태그</th>
                    <th className="px-4 py-2 text-right">합계</th>
                  </tr>
                </thead>
                <tbody>
                  {tagSummary.map((item) => (
                    <tr key={item.tag}>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTagColor(item.tag)}`}>
                          {item.tag}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {item.total.toLocaleString()}원
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-100">
                    <td className="px-4 py-2">태그 전체 합계</td>
                    <td className="px-4 py-2 text-right">
                      {tagSummary
                        .reduce((sum, item) => sum + item.total, 0)
                        .toLocaleString()}
                      원
                    </td>
                  </tr>
            </tbody>
          </table>
        </div>
      </div>
        )}
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
                  태그
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300"
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={handleAddEditTag}
                  placeholder="태그를 입력하고 Enter 또는 쉼표를 누르세요"
                />
                {editForm.tags && editForm.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {editForm.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveEditTag(tag)}
                          className="ml-1 text-xs hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  onClick={handleDeleteTransaction}
                  disabled={editLoading}
                >
                  {editLoading ? '처리 중...' : '삭제'}
                </button>
                <button
                  className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                  onClick={handleEditSave}
                  disabled={editLoading}
                >
                  {editLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 엑셀 미리보기 모달 */}
      {excelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-6xl relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={closeExcelModal}>✕</button>
            <h2 className="text-lg font-bold mb-4">엑셀 데이터 미리보기</h2>
            
            {/* 신규 카테고리 알림 */}
            {newCategories.length > 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">신규 카테고리 발견</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  다음 카테고리들이 기존 카테고리에 없습니다. 추가하시겠습니까?
                </p>
                <div className="flex flex-wrap gap-2">
                  {newCategories.map((category) => (
                    <div key={category} className="flex items-center gap-2 bg-white px-3 py-1 rounded border">
                      <span className="text-sm font-medium text-red-600">{category}</span>
                      <button
                        className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        onClick={() => addNewCategory(category)}
                      >
                        추가
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">날짜</th>
                    <th className="px-4 py-2">분류</th>
                    <th className="px-4 py-2">금액</th>
                    <th className="px-4 py-2">태그</th>
                    <th className="px-4 py-2">메모</th>
                    <th className="px-4 py-2">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {excelPreviewRows.map((row, idx) => (
                    <tr key={idx} className={!isExistingCategory(row.category) ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2">
                        <input type="date" className="border rounded px-2 py-1 w-32" value={row.date} onChange={e => handleExcelEdit(idx, 'date', e.target.value)} />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="text" 
                          className={`border rounded px-2 py-1 w-32 ${!isExistingCategory(row.category) ? 'border-red-500 bg-red-50' : ''}`}
                          value={row.category} 
                          onChange={e => handleExcelEdit(idx, 'category', e.target.value)} 
                        />
                        {!isExistingCategory(row.category) && (
                          <div className="text-xs text-red-500 mt-1">신규 카테고리</div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" className="border rounded px-2 py-1 w-24" value={row.amount} onChange={e => handleExcelEdit(idx, 'amount', e.target.value)} />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="text" 
                          className="border rounded px-2 py-1 w-32 mb-1" 
                          value={excelTagInputs[idx] || ''} 
                          onChange={e => setExcelTagInputs(prev => ({ ...prev, [idx]: e.target.value }))}
                          onKeyDown={e => handleAddExcelTag(idx, e)}
                          placeholder="태그 입력 후 Enter"
                        />
                        {row.tags && row.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {row.tags.map((tag: string, tagIdx: number) => (
                              <span
                                key={tagIdx}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExcelTag(idx, tag)}
                                  className="ml-1 text-xs hover:text-red-600"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" className="border rounded px-2 py-1 w-32" value={row.memo} onChange={e => handleExcelEdit(idx, 'memo', e.target.value)} />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button className="text-red-500 hover:underline" onClick={() => handleExcelDelete(idx)}>삭제</button>
                      </td>
                    </tr>
                  ))}
                  {excelPreviewRows.length === 0 && (
                    <tr><td colSpan={6} className="text-center">데이터가 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400" onClick={closeExcelModal}>취소</button>
              <button 
                className={`px-4 py-2 rounded text-white ${newCategories.length > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                onClick={handleExcelSave}
                disabled={newCategories.length > 0}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
