import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  console.log('Middleware: updateSession called')
  
  // 환경 변수를 테스트 목적으로 하드코딩
  const supabaseUrl = 'https://lnmfqukglmchxadzmshe.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubWZxdWtnbG1jaHhhZHptc2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjE4OTMsImV4cCI6MjA2Mjg5Nzg5M30.UuN3G-_kid2qDSrovShcs1nPfwwKtl4fpI5DUwLcLAs'
  
  console.log('Middleware: Using Supabase URL', supabaseUrl.substring(0, 15) + '...')
  console.log('Middleware: Using Supabase Key (first 10 chars)', supabaseAnonKey.substring(0, 10) + '...')
  
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      supabaseUrl,  // 하드코딩된 URL 사용
      supabaseAnonKey,  // 하드코딩된 Key 사용
      {
        auth: {
          // 자동 로그인 방지
          persistSession: false,
          autoRefreshToken: false,
          // PKCE 인증 흐름 설정
          flowType: 'pkce'
        },
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            supabaseResponse.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            supabaseResponse.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // 이 라인은 서버 측에서 PKCE 검증을 위해 유지합니다
    // 자동 로그인 비활성화를 위해 주석 처리했던 부분 다시 활성화
    await supabase.auth.getUser()
    console.log('Middleware: Session context processed (PKCE enabled)')
    
    return supabaseResponse
  } catch (error) {
    console.error('Middleware error:', error)
    return supabaseResponse
  }
} 