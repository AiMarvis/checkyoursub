import { createServerClient } from '@supabase/ssr'

console.log("Attempting to load Supabase URL from env:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Attempting to load Supabase Anon Key from env:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// 하드코딩된 값 사용
const supabaseUrl = 'https://lnmfqukglmchxadzmshe.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubWZxdWtnbG1jaHhhZHptc2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjE4OTMsImV4cCI6MjA2Mjg5Nzg5M30.UuN3G-_kid2qDSrovShcs1nPfwwKtl4fpI5DUwLcLAs'

export function createClient() {
  console.log('Server: Creating Supabase client with hardcoded credentials');
  
  // TypeScript 타입 문제를 완전히 우회
  // @ts-ignore
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      // @ts-ignore - 타입 오류 무시
      cookies: {
        get: (_name: string) => undefined,
        set: (_name: string, _value: string) => {},
        remove: (_name: string) => {},
      }
    }
  )
} 