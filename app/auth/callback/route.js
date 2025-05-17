import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")
  const origin = requestUrl.origin

  console.log("Auth callback triggered with URL:", request.url)
  
  // 오류 처리 - 외부 오류 파라미터 확인
  if (error || error_description) {
    console.error("OAuth Error:", error, error_description)
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(error_description || "인증 과정에서 오류가 발생했습니다.")}`
    )
  }
  
  // 코드 없음 처리
  if (!code) {
    console.error("No code parameter found in callback URL")
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent("인증 코드가 없습니다. 다시 시도해주세요.")}`
    )
  }

  try {
    const supabaseUrl = 'https://lnmfqukglmchxadzmshe.supabase.co'
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubWZxdWtnbG1jaHhhZHptc2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjE4OTMsImV4cCI6MjA2Mjg5Nzg5M30.UuN3G-_kid2qDSrovShcs1nPfwwKtl4fpI5DUwLcLAs'
    
    console.log("Creating server client for OAuth code exchange")
    
    const cookieStore = cookies()
    
    // 기존 쿠키 확인 (디버깅용)
    const existingCookies = cookieStore.getAll();
    console.log("Existing cookies:", existingCookies.map(c => c.name).join(', '));
    
    // 서버 클라이언트 생성
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name) {
            const cookie = cookieStore.get(name);
            const value = cookie?.value;
            console.log(`Callback: Getting cookie ${name} - ${value ? 'exists' : 'not found'}`);
            return value;
          },
          set(name, value, options) {
            try {
              console.log(`Callback: Setting cookie ${name} with max-age:`, options.maxAge);
              cookieStore.set({ 
                name, 
                value, 
                ...options,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: options.maxAge || 60 * 60 * 24 * 7 // 기본 7일
              });
            } catch (error) {
              console.error("Callback: Error setting cookie:", error);
            }
          },
          remove(name, options) {
            try {
              console.log(`Callback: Removing cookie ${name}`);
              cookieStore.set({ 
                name, 
                value: '', 
                ...options, 
                maxAge: -1,
                path: '/' 
              });
            } catch (error) {
              console.error("Callback: Error removing cookie:", error);
            }
          },
        },
      }
    );

    console.log("Exchanging code for session...")
    
    // 코드를 세션으로 교환
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Error exchanging code for session:", error.message, error.stack);
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent("인증 과정에서 오류가 발생했습니다: " + error.message)}`
      );
    }

    if (!data?.session) {
      console.error("No session data returned after code exchange");
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent("세션이 생성되지 않았습니다. 다시 시도해주세요.")}`
      );
    }

    // 세션 정보 확인
    const { user, access_token, refresh_token } = data.session;
    console.log("Session established for user:", user.id);
    console.log("Access token length:", access_token?.length);
    console.log("Refresh token exists:", !!refresh_token);

    // 설정된 쿠키 확인 (디버깅용)
    const updatedCookies = cookieStore.getAll();
    console.log("Updated cookies after auth:", updatedCookies.map(c => c.name).join(', '));

    // 사용자 프로필 확인 또는 생성
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select()
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.log("Error fetching profile:", profileError.message);
      }

      if (!profile) {
        console.log("Creating new profile for user:", user.id);
        const metadata = user.user_metadata || {};
        
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          username: metadata.name || metadata.user_name || metadata.preferred_username || (user.email ? user.email.split("@")[0] : `user_${user.id.substring(0, 8)}`),
          avatar_url: metadata.avatar_url || metadata.picture,
          is_admin: false,
        });
        
        if (insertError) {
          console.error("Error creating profile:", insertError.message);
        } else {
          console.log("Profile created successfully");
        }
      } else {
        console.log("Existing profile found");
      }
    } catch (profileError) {
      // 프로필 오류는 로그인 과정을 중단시키지 않음
      console.error("Error handling profile:", profileError);
    }

    // 추가적인 디버깅 정보 로그
    console.log("Auth callback completed successfully, redirecting to dashboard");
    
    // 인증 완료 후 대시보드로 리디렉션 (여기를 변경)
    const response = NextResponse.redirect(`${origin}/dashboard`);
    
    return response;
  } catch (error) {
    console.error("Unexpected error in auth callback:", error);
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent("인증 처리 중 예기치 않은 오류가 발생했습니다")}`
    );
  }
}
