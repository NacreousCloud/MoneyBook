import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/user/login',
  '/user/join',
  '/_next',
  '/favicon.ico',
  '/api',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일, API, 로그인/회원가입 페이지는 예외
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 클라이언트 쿠키에서 supabase 토큰 확인 (예: supabase-auth-token)
  const token = request.cookies.get('sb-access-token')?.value;

  if (!token) {
    const loginUrl = new URL('/user/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
}; 