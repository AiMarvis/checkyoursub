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
import type { User } from '@supabase/supabase-js'
import type { PostgrestError } from '@supabase/supabase-js'

export default function ProfilePage() {
  const router = useRouter()
  const { supabase, isLoading: sbIsLoading, user: providerUser, session: providerSession } = useSupabase()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(providerUser)
  const [profile, setProfile] = useState<any>(null)
  const [username, setUsername] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  console.log("ProfilePage: Component rendered. sbIsLoading:", sbIsLoading, "user:", !!providerUser);

  // 타임아웃 처리
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (pageLoading) {
        console.log("ProfilePage: 로딩 타임아웃 발생");
        setPageLoading(false);
        
        // 세션이 없을 경우 홈으로 리디렉션
        if (!user && !providerUser) {
          console.log("ProfilePage: 세션 없음, 인증 페이지로 리디렉션");
          toast({ 
            title: "로그인이 필요합니다", 
            description: "프로필에 접근하려면 로그인이 필요합니다.", 
            variant: "destructive" 
          });
          
          // 타임아웃 후 리디렉션
          setTimeout(() => {
            router.push("/auth");
          }, 2000);
        }
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [pageLoading, user, providerUser, router, toast]);

  useEffect(() => {
    console.log("ProfilePage: useEffect triggered. sbIsLoading:", sbIsLoading, "supabase:", !!supabase);
    
    if (sbIsLoading) {
      console.log("ProfilePage: Supabase 로딩 중, 대기 중...");
      return;
    }
    
    // Provider에서 사용자가 이미 로드된 경우
    if (providerUser) {
      console.log("ProfilePage: Provider에서 사용자 발견:", providerUser.id.substring(0, 8));
      setUser(providerUser);
      setPageLoading(false);
      fetchProfile(providerUser.id);
      return;
    }
    
    // Provider에 사용자가 없는 경우 세션 확인
    const checkUser = async () => {
      if (!supabase) {
        console.log("ProfilePage: Supabase 클라이언트 없음");
        setPageLoading(false);
        return;
      }
      
      try {
        console.log("ProfilePage: 세션 가져오기 시도");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("ProfilePage: 세션 가져오기 오류:", error);
          setPageLoading(false);
          return;
        }
        
        if (data?.session?.user) {
          console.log("ProfilePage: 유효한 세션 발견:", data.session.user.id.substring(0, 8));
          setUser(data.session.user);
          fetchProfile(data.session.user.id);
        } else {
          console.log("ProfilePage: 세션 없음");
          // 리디렉션은 타임아웃 처리에서 수행
        }
        
        setPageLoading(false);
      } catch (error) {
        console.error("ProfilePage: 세션 검증 중 오류:", error);
        setPageLoading(false);
      }
    };
    
    checkUser();
  }, [sbIsLoading, supabase, providerUser, providerSession]);

  const fetchProfile = async (userId: string) => {
    if (!supabase) return;
    
    console.log("ProfilePage: fetchProfile called for userId:", userId);
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("ProfilePage: Error fetching profile:", error);
        
        // 프로필이 없으면 생성
        if (error.code === 'PGRST116' && user) {
          console.log("ProfilePage: Profile not found, creating new one");
          const metadata = user.user_metadata || {};
          const newProfile = {
            id: userId,
            email: user.email,
            username: metadata.name || metadata.user_name || metadata.preferred_username || (user.email ? user.email.split("@")[0] : `user_${userId.substring(0, 8)}`),
            avatar_url: metadata.avatar_url || metadata.picture,
            is_admin: false,
          };
          
          const { data: createData, error: createError } = await supabase.from("profiles").insert(newProfile).select();
          
          if (createError) {
            console.error("ProfilePage: Error creating profile:", createError);
            toast({
              title: "프로필 생성 실패",
              description: createError.message,
              variant: "destructive",
            });
          } else if (createData && createData.length > 0) {
            console.log("ProfilePage: Profile created successfully");
            setProfile(createData[0]);
            setUsername(createData[0].username || "");
            return;
          }
        }
        
        throw error;
      }
      
      console.log("ProfilePage: Profile fetched successfully");
      setProfile(data)
      setUsername(data.username || "")
    } catch (error) {
      console.error("ProfilePage: Exception in fetchProfile:", error);
      const err = error as PostgrestError;
      toast({
        title: "프로필 로드 실패",
        description: err.message || "프로필을 불러오는 데 실패했습니다",
        variant: "destructive",
      })
    }
  }

  const handleUpdateProfile = async () => {
    if (!user || !supabase) return;
    
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
      setProfile((prev: any) => ({ ...prev, username }))
    } catch (error) {
      const err = error as PostgrestError;
      toast({
        title: "프로필 업데이트 실패",
        description: err.message || "프로필 업데이트에 실패했습니다",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || !supabase) return;
    
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
      const err = error as Error;
      toast({
        title: "계정 삭제 실패",
        description: err.message || "계정 삭제에 실패했습니다",
        variant: "destructive",
      })
    }
  }

  if (pageLoading) {
    console.log("ProfilePage: Rendering loading spinner (pageLoading is true)");
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !profile) {
    console.log("ProfilePage: User or profile not loaded after loading completed");
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
            <p className="mb-6 text-gray-400">프로필을 확인하려면 로그인해 주세요.</p>
            <Button onClick={() => router.push("/auth")}>로그인 페이지로 이동</Button>
          </div>
        </div>
      </div>
    );
  }

  console.log("ProfilePage: Rendering main content");
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
              <Input id="email" value={user.email || ''} disabled className="bg-gray-50 dark:bg-gray-800" />
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
                로그인 방법: {user.app_metadata?.provider === "google" ? "Google" : user.app_metadata?.provider === "github" ? "GitHub" : "카카오"}
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
