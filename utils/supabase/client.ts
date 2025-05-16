import { createBrowserClient } from '@supabase/ssr'

console.log("Client: Attempting to load Supabase URL from env:", process.env.NEXT_PUBLIC_SUPABASE_URL);

// 싱글톤 패턴을 위한 클라이언트 인스턴스 저장
let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // 이미 생성된 인스턴스가 있으면 재사용
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }
  
  // 환경 변수 대신 하드코딩된 값 사용
  const supabaseUrl = 'https://lnmfqukglmchxadzmshe.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubWZxdWtnbG1jaHhhZHptc2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjE4OTMsImV4cCI6MjA2Mjg5Nzg5M30.UuN3G-_kid2qDSrovShcs1nPfwwKtl4fpI5DUwLcLAs'
  
  console.log("Client: Using hardcoded Supabase URL:", supabaseUrl.substring(0, 15) + '...');
  
  try {
    // 클라이언트 생성 및 싱글톤 인스턴스 저장
    supabaseClientInstance = createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          // 자동 로그인 방지를 위해 세션 지속성 비활성화
          persistSession: false,
          // 사용하지 않는 스토리지 키로 설정 (null이 아닌 빈 문자열 사용)
          storageKey: 'no-session-storage',
          // 브라우저 종료 시 세션 만료
          autoRefreshToken: false,
          // PKCE 인증 활성화
          flowType: 'pkce',
          // 브라우저 PKCE 인증을 위한 설정
          detectSessionInUrl: true,
          // 쿠키 저장 명시적 활성화
          storage: {
            getItem: (key) => {
              const item = window.localStorage.getItem(key);
              return item;
            },
            setItem: (key, value) => {
              window.localStorage.setItem(key, value);
            },
            removeItem: (key) => {
              window.localStorage.removeItem(key);
            },
          }
        }
      }
    );
    
    // 브라우저 새로고침 시 이전 세션 제거
    supabaseClientInstance.auth.signOut({ scope: 'local' }).catch((err: any) => {
      console.error('세션 초기화 중 오류:', err);
    });
    
    return supabaseClientInstance;
  } catch (error) {
    console.error('Error creating Supabase client in browser:', error)
    throw error
  }
} 