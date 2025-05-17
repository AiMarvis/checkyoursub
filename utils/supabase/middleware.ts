import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  console.log('Middleware: updateSession called for path:', request.nextUrl.pathname)
  
  // 정적 리소스 경로는 처리하지 않음
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.includes('.') // 파일 확장자가 있는 경로는 건너뜀
  ) {
    return NextResponse.next();
  }

  const supabaseUrl = 'https://lnmfqukglmchxadzmshe.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubWZxdWtnbG1jaHhhZHptc2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjE4OTMsImV4cCI6MjA2Mjg5Nzg5M30.UuN3G-_kid2qDSrovShcs1nPfwwKtl4fpI5DUwLcLAs'
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // 쿠키 관리 함수 정의
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            const cookie = request.cookies.get(name)
            console.log(`Middleware: Getting cookie ${name} - ${cookie ? 'exists' : 'not found'}`)
            return cookie?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log(`Middleware: Setting cookie ${name}`)
            // 쿠키 설정
            response.cookies.set({
              name,
              value,
              ...options,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              // 세션 쿠키 만료일 설정 (7일)
              maxAge: 60 * 60 * 24 * 7
            })
          },
          remove(name: string, options: CookieOptions) {
            console.log(`Middleware: Removing cookie ${name}`)
            response.cookies.set({
              name,
              value: '',
              ...options,
              path: '/',
              maxAge: -1
            })
          },
        },
      }
    )

    // 세션 갱신 및 검증
    const { data: { session } } = await supabase.auth.getSession()
    
    // 세션 정보 디버깅
    if (session) {
      console.log(`Middleware: Valid session found for user: ${session.user.id.substring(0, 8)}...`)
      
      // 보호된 경로 확인
      const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                               request.nextUrl.pathname.startsWith('/profile') || 
                               request.nextUrl.pathname.startsWith('/admin')
      
      if (isProtectedRoute) {
        console.log('Middleware: User accessing protected route with valid session')
      }
    } else {
      console.log('Middleware: No valid session found')
      
      // 보호된 경로 확인
      const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                               request.nextUrl.pathname.startsWith('/profile') || 
                               request.nextUrl.pathname.startsWith('/admin')
      
      // 보호된 경로인데 세션이 없는 경우 로그인 페이지로 리디렉션
      if (isProtectedRoute) {
        console.log('Middleware: Redirecting from protected route to auth due to missing session')
        return NextResponse.redirect(new URL('/auth', request.url))
      }
    }
    
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return response
  }
} 