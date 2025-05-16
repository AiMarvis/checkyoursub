import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  // 디버그 로깅 추가
  console.log("Auth callback triggered with URL:", request.url)
  console.log("Auth callback code:", code ? "Code exists" : "No code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      // 코드를 세션으로 교환
      console.log("Exchanging code for session...")
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Error exchanging code for session:", error)
        return NextResponse.redirect(`${requestUrl.origin}/auth?error=${encodeURIComponent(error.message)}`)
      }

      console.log("Session established successfully")

      // 사용자가 프로필 테이블에 존재하는지 확인
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        console.log("Session established for user:", session.user.id)
        console.log("User metadata:", JSON.stringify(session.user.user_metadata))

        // 프로필 확인
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select()
          .eq("id", session.user.id)
          .single()

        // 프로필이 없으면 생성
        if (profileError || !profile) {
          console.log("Creating new profile for user:", session.user.id)

          // 사용자 메타데이터 가져오기
          const { user } = session
          const metadata = user.user_metadata || {}

          // 사용 가능한 데이터로 프로필 생성
          const { error: insertError } = await supabase.from("profiles").insert({
            id: user.id,
            email: user.email,
            username: metadata.name || metadata.user_name || metadata.preferred_username || user.email.split("@")[0],
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
      }
    } catch (error) {
      console.error("Unexpected error in auth callback:", error)
      return NextResponse.redirect(`${requestUrl.origin}/auth?error=${encodeURIComponent("Authentication failed")}`)
    }
  } else {
    console.error("No code parameter found in callback URL")
    return NextResponse.redirect(
      `${requestUrl.origin}/auth?error=${encodeURIComponent("No authentication code received")}`,
    )
  }

  // 로그인 프로세스 완료 후 리디렉션할 URL
  console.log("Redirecting to dashboard")
  return NextResponse.redirect(requestUrl.origin + "/dashboard")
}
