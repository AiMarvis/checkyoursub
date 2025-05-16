"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ProfilePage() {
  const router = useRouter()
  const { supabase, isLoading } = useSupabase()
  const { toast } = useToast()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [username, setUsername] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth")
        return
      }
      setUser(session.user)
      fetchProfile(session.user.id)
    }

    if (!isLoading) {
      checkUser()
    }
  }, [supabase, router, isLoading])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) throw error
      setProfile(data)
      setUsername(data.username || "")
    } catch (error) {
      toast({
        title: "프로필 로드 실패",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      toast({
        title: "닉네임 필수",
        description: "닉네임을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)
    try {
      const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id)

      if (error) throw error

      toast({
        title: "프로필 업데이트 완료",
        description: "닉네임이 성공적으로 변경되었습니다.",
      })

      // Update local state
      setProfile((prev) => ({ ...prev, username }))
    } catch (error) {
      toast({
        title: "프로필 업데이트 실패",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // First delete user data from profiles table
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", user.id)

      if (profileError) throw profileError

      // Then delete user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)
      if (authError) throw authError

      // Sign out
      await supabase.auth.signOut()

      toast({
        title: "계정 삭제 완료",
        description: "계정이 성공적으로 삭제되었습니다.",
      })

      router.push("/")
    } catch (error) {
      toast({
        title: "계정 삭제 실패",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (isLoading || !user || !profile) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">내 프로필</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>프로필 정보</CardTitle>
            <CardDescription>프로필 정보를 확인하고 수정하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" value={user.email} disabled className="bg-gray-50 dark:bg-gray-800" />
              <p className="text-sm text-gray-500">이메일은 변경할 수 없습니다.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">닉네임</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="닉네임을 입력하세요"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleUpdateProfile} disabled={isUpdating}>
              {isUpdating ? "저장 중..." : "변경사항 저장"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>계정 관리</CardTitle>
            <CardDescription>계정 관련 설정을 관리하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                로그인 방법: {user.app_metadata.provider === "google" ? "Google" : "카카오"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                가입일: {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">계정 삭제</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>정말 계정을 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 작업은 되돌릴 수 없습니다. 계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
