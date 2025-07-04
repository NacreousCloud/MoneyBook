'use client';

import { useEffect, useState } from 'react';

interface Category {
  id: string;
  name: string;
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // 카테고리 목록 불러오기
  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 카테고리 추가
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategory, user_id: 'test-user' }), // TODO: 실제 user_id로 대체
    });
    setNewCategory('');
    fetchCategories();
  };

  // 카테고리 수정
  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    await fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editName }),
    });
    setEditId(null);
    setEditName('');
    fetchCategories();
  };

  // 카테고리 삭제
  const handleDelete = async (id: string) => {
    await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchCategories();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <h2 className="text-lg font-bold mb-2">카테고리 관리</h2>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="새 카테고리 이름"
          className="flex-1 rounded border px-2 py-1"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-1 rounded"
        >
          추가
        </button>
      </form>
      <ul className="divide-y divide-gray-200">
        {categories.map((cat) => (
          <li key={cat.id} className="flex items-center justify-between py-2">
            {editId === cat.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded border px-2 py-1 mr-2"
                />
                <button
                  onClick={() => handleEdit(cat.id)}
                  className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setEditId(null);
                    setEditName('');
                  }}
                  className="bg-gray-300 px-2 py-1 rounded"
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <span>{cat.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditId(cat.id);
                      setEditName(cat.name);
                    }}
                    className="bg-yellow-400 text-white px-2 py-1 rounded"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    삭제
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
