'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserHeader() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // sb-access-token 쿠키가 있으면 유저 정보 fetch
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('sb-access-token='))
      ?.split('=')[1];
    if (!token) return;
    // Supabase REST API로 유저 정보 가져오기
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = () => {
    document.cookie = 'sb-access-token=; Max-Age=0; path=/;';
    router.push('/user/login');
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <span className="text-gray-700 text-sm font-medium">{user.email}</span>
      <button
        onClick={handleLogout}
        className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300"
      >
        로그아웃
      </button>
    </div>
  );
}
