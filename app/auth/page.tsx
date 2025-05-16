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

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase, isLoading } = useSupabase()
  const { toast } = useToast()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState("")

  // 에러 파라미터 확인
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        router.push("/dashboard")
      }
    }

    if (!isLoading) {
      checkUser()
    }
  }, [supabase, router, isLoading])

  const handleSocialLogin = async (provider) => {
    setIsAuthenticating(true)
    setError("")
    try {
      // 현재 URL을 기반으로 리디렉션 URL 설정
      const redirectTo = `${window.location.origin}/auth/callback`
      console.log("Redirect URL:", redirectTo)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          // GitHub의 경우 스코프 추가
          scopes: provider === "github" ? "user:email" : undefined,
        },
      })

      if (error) {
        throw error
      }

      // 리디렉션 URL이 있으면 사용
      if (data?.url) {
        console.log("OAuth URL:", data.url)
        window.location.href = data.url
      }
    } catch (error) {
      console.error(`${provider} login error:`, error)
      setError(error.message || `${provider} 로그인 중 오류가 발생했습니다.`)
      setIsAuthenticating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

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

          <div className="flex items-center gap-2 py-2">
            <Separator className="flex-grow bg-gray-700" />
            <span className="text-xs text-gray-400">Login with social accounts</span>
            <Separator className="flex-grow bg-gray-700" />
          </div>

          <div className="flex justify-center gap-4">
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
