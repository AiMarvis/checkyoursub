import { createBrowserClient } from '@supabase/ssr'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'

// 디버깅을 위한 환경 변수 로그
console.log("Client: Initializing Supabase client code")

// 싱글톤 패턴을 위한 클라이언트 인스턴스 저장
let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // 이미 생성된 인스턴스가 있으면 재사용
  if (supabaseClientInstance) {
    console.log("Client: Returning existing Supabase client instance")
    return supabaseClientInstance;
  }
  
  // 환경 변수 대신 하드코딩된 값 사용
  const supabaseUrl = 'https://lnmfqukglmchxadzmshe.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubWZxdWtnbG1jaHhhZHptc2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjE4OTMsImV4cCI6MjA2Mjg5Nzg5M30.UuN3G-_kid2qDSrovShcs1nPfwwKtl4fpI5DUwLcLAs'
  
  console.log("Client: Creating new Supabase client instance")
  
  try {
    // 클라이언트 생성 및 싱글톤 인스턴스 저장
    supabaseClientInstance = createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          flowType: 'pkce',
          detectSessionInUrl: true,
          // Auth 상태 변경 시 localStorage 및 쿠키 동기화를 위한 스토리지 설정
          storage: {
            getItem: (key) => {
              try {
                const value = localStorage.getItem(key);
                console.log(`Client: Getting from localStorage - ${key}: ${value ? 'exists' : 'not found'}`);
                return value;
              } catch (error) {
                console.error(`Client: Error getting item ${key} from localStorage:`, error);
                return null;
              }
            },
            setItem: (key, value) => {
              try {
                console.log(`Client: Setting in localStorage - ${key}`);
                localStorage.setItem(key, value);
              } catch (error) {
                console.error(`Client: Error setting item ${key} in localStorage:`, error);
              }
            },
            removeItem: (key) => {
              try {
                console.log(`Client: Removing from localStorage - ${key}`);
                localStorage.removeItem(key);
              } catch (error) {
                console.error(`Client: Error removing item ${key} from localStorage:`, error);
              }
            },
          }
        },
        cookies: {
          get(name) {
            try {
              const value = document.cookie
                .split('; ')
                .find((row) => row.startsWith(`${name}=`))
                ?.split('=')[1];
              console.log(`Client: Getting cookie - ${name}: ${value ? 'exists' : 'not found'}`);
              return value;
            } catch (error) {
              console.error(`Client: Error getting cookie ${name}:`, error);
              return null;
            }
          },
          set(name, value, options) {
            try {
              console.log(`Client: Setting cookie - ${name}`);
              document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`;
            } catch (error) {
              console.error(`Client: Error setting cookie ${name}:`, error);
            }
          },
          remove(name, options) {
            try {
              console.log(`Client: Removing cookie - ${name}`);
              document.cookie = `${name}=; path=/; max-age=-1;`;
            } catch (error) {
              console.error(`Client: Error removing cookie ${name}:`, error);
            }
          },
        }
      }
    );
    
    // 인증 상태 변경 이벤트 리스너 설정 및 디버깅
    supabaseClientInstance.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      console.log(`Client: Auth state changed - Event: ${event}, User: ${session?.user?.id?.substring(0, 8) || 'No user'}`);
      
      // 세션 변경 시 로컬 스토리지 확인 (디버깅용)
      try {
        const hasAccessToken = !!localStorage.getItem('sb-access-token');
        const hasRefreshToken = !!localStorage.getItem('sb-refresh-token');
        console.log(`Client: After auth change - Access token: ${hasAccessToken ? 'exists' : 'missing'}, Refresh token: ${hasRefreshToken ? 'exists' : 'missing'}`);
      } catch (e) {
        console.error('Client: Error checking localStorage tokens:', e);
      }
      
      // 페이지 새로고침 방지 - 세션 스토리지에 이미 세션 정보가 있는지 확인
      if (event === 'SIGNED_IN') {
        try {
          sessionStorage.setItem('sb-auth-event-processed', 'true');
        } catch (e) {
          console.error('Client: Error setting sessionStorage flag:', e);
        }
      }
    });
    
    return supabaseClientInstance;
  } catch (error) {
    console.error('Client: Error creating Supabase client in browser:', error)
    throw error
  }
} 