import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  // 디버그 로깅 추가
  console.log("Auth callback triggered with URL:", request.url)
  console.log("Auth callback code:", code ? "Code exists" : "No code")

  if (!code) {
    console.error("No code parameter found in callback URL")
    return NextResponse.redirect(
      `${requestUrl.origin}/auth?error=${encodeURIComponent("No authentication code received")}`,
    )
  }

  try {
    // 환경 변수를 우선 사용, 없으면 하드코딩된 값 사용 (프로덕션에서는 환경 변수 사용 필수)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lnmfqukglmchxadzmshe.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubWZxdWtnbG1jaHhhZHptc2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjE4OTMsImV4cCI6MjA2Mjg5Nzg5M30.UuN3G-_kid2qDSrovShcs1nPfwwKtl4fpI5DUwLcLAs'
    
    const cookieStore = cookies()
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // 서버 컴포넌트에서 호출될 경우 무시
              console.log("Unable to set cookie:", name, error)
            }
          },
          remove(name, options) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // 서버 컴포넌트에서 호출될 경우 무시
              console.log("Unable to remove cookie:", name, error)
            }
          },
        },
      }
    )

    // 코드를 세션으로 교환
    console.log("Exchanging code for session...")
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Error exchanging code for session:", error.message)
      // PKCE 관련 오류 메시지를 좀 더 구체적으로 확인
      if (error.message.includes("code verifier") || error.message.includes("auth code")) {
         console.error("PKCE related error details:", JSON.stringify(error, null, 2))
      }
      return NextResponse.redirect(`${requestUrl.origin}/auth?error=${encodeURIComponent(error.message)}`)
    }

    console.log("Session established successfully, session data:", data.session)

    // 사용자가 프로필 테이블에 존재하는지 확인
    if (data.session && data.session.user) {
      console.log("Session established for user:", data.session.user.id)
      console.log("User metadata:", JSON.stringify(data.session.user.user_metadata))

      // 프로필 확인
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select()
        .eq("id", data.session.user.id)
        .single()

      // 프로필이 없으면 생성
      if (profileError || !profile) {
        console.log("Creating new profile for user:", data.session.user.id)

        // 사용자 메타데이터 가져오기
        const { user } = data.session
        const metadata = user.user_metadata || {}

        // 사용 가능한 데이터로 프로필 생성
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          username: metadata.name || metadata.user_name || metadata.preferred_username || (user.email ? user.email.split("@")[0] : `user_${user.id.substring(0, 8)}`),
          avatar_url: metadata.avatar_url || metadata.picture,
          is_admin: false,
        })

        if (insertError) {
          console.error("Error creating profile:", insertError)
        } else {
          console.log("Profile created successfully")
        }
      } else {
        console.log("User profile already exists")
      }
    } else {
      console.warn("Session or user data is not available after exchanging code.")
    }
  } catch (error) {
    console.error("Unexpected error in auth callback:", error instanceof Error ? error.message : String(error))
    return NextResponse.redirect(`${requestUrl.origin}/auth?error=${encodeURIComponent("Authentication failed due to an unexpected error")}`)
  }

  // 로그인 프로세스 완료 후 리디렉션할 URL
  console.log("Redirecting to dashboard")
  return NextResponse.redirect(requestUrl.origin + "/dashboard")
}
