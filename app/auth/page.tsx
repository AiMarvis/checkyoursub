"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { AuthError, Provider } from '@supabase/supabase-js'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase, isLoading } = useSupabase()
  const { toast } = useToast()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState("")

  console.log("AuthPage: Component rendered. isLoading:", isLoading);

  // 에러 파라미터 확인
  useEffect(() => {
    console.log("AuthPage: Error param effect triggered.");
    const errorParam = searchParams.get("error")
    if (errorParam) {
      console.log("AuthPage: Error param found:", errorParam);
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  useEffect(() => {
    console.log(`AuthPage: checkUser effect triggered. isLoading: ${isLoading}`);
    const checkUser = async () => {
      console.log("AuthPage: checkUser function called.");
      if (!supabase) {
        console.log("AuthPage: supabase client is not available yet.");
        return;
      }
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("AuthPage: Error getting session:", sessionError);
          setError("세션 정보를 가져오는 중 오류가 발생했습니다.");
          return;
        }

        if (session) {
          console.log("AuthPage: Session found. Redirecting to /dashboard.", session);
          router.push("/dashboard")
        } else {
          console.log("AuthPage: No active session found.");
        }
      } catch (e: any) {
        console.error("AuthPage: Exception in checkUser:", e);
        setError("세션 확인 중 예기치 않은 오류가 발생했습니다.");
      }
    }

    if (!isLoading) {
      console.log("AuthPage: isLoading is false, calling checkUser.");
      checkUser()
    } else {
      console.log("AuthPage: isLoading is true, not calling checkUser yet.");
    }
  }, [supabase, router, isLoading])

  const handleSocialLogin = async (provider: Provider) => {
    setIsAuthenticating(true)
    setError("")
    if (!supabase) {
      console.error("AuthPage: Supabase client not available for social login.")
      setError("로그인 서비스가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.")
      setIsAuthenticating(false)
      return
    }
    try {
      // 현재 URL을 기반으로 리디렉션 URL 설정
      const redirectTo = `${window.location.origin}/auth/callback`
      console.log("Redirect URL:", redirectTo)

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          // GitHub의 경우 스코프 추가
          scopes: provider === "github" ? "user:email" : undefined,
        },
      })

      if (oauthError) {
        throw oauthError
      }

      // 리디렉션 URL이 있으면 사용
      if (data?.url) {
        console.log("OAuth URL:", data.url)
        window.location.href = data.url
      }
    } catch (err: any) {
      console.error(`${provider} login error:`, err)
      const message = (err as AuthError)?.message || (err as Error)?.message || `${provider} 로그인 중 오류가 발생했습니다.`
      setError(message)
      setIsAuthenticating(false)
    }
  }

  if (isLoading) {
    console.log("AuthPage: Rendering loading state.");
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  console.log("AuthPage: Rendering main content.");
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-4rem)] bg-[#0a0f1a]">
      <Card className="w-full max-w-md bg-[#0f172a] text-white border border-gray-800">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold gradient-heading">Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-400">
              Username
            </Label>
            <Input id="username" className="bg-[#1e293b] border-[#334155] text-white" disabled={true} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="password" className="text-gray-400">
                Password
              </Label>
              <span className="text-sm text-gray-400 hover:text-white cursor-pointer">Forgot Password?</span>
            </div>
            <Input id="password" type="password" className="bg-[#1e293b] border-[#334155] text-white" disabled={true} />
          </div>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={true}>
            Sign in
          </Button>

          <div className="flex items-center gap-2 py-2 justify-center">
            <div className="flex-grow"><Separator className="bg-gray-700" /></div>
            <span className="text-xs text-gray-400 whitespace-nowrap">소셜 계정으로 로그인</span>
            <div className="flex-grow"><Separator className="bg-gray-700" /></div>
          </div>

          <div className="flex justify-center gap-4 pt-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 bg-transparent border-gray-700 hover:bg-gray-800"
              onClick={() => handleSocialLogin("google")}
              disabled={isAuthenticating}
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 bg-transparent border-gray-700 hover:bg-gray-800"
              onClick={() => handleSocialLogin("github")}
              disabled={isAuthenticating}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.16 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 bg-[#FEE500] border-transparent hover:bg-[#FEE500]/90"
              onClick={() => handleSocialLogin("kakao")}
              disabled={isAuthenticating}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 38 38">
                <path fill="#000000" d="M19 4.75C10.585 4.75 4 9.955 4 16.64c0 4.335 2.695 8.105 6.69 10.125L9.62 31.5l4.795-2.97c1.4.27 2.86.415 4.36.415 9.415 0 15.225-5.205 15.225-11.89C34.000 9.955 27.415 4.75 19 4.75"/>
              </svg>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-400">
            Don't have an account?
            <span className="text-blue-400 ml-1 cursor-pointer hover:underline">Sign up</span>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
