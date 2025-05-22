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
  const { supabase, isLoading: sbIsLoading, user: providerUser, session: providerSession, authHasResolved } = useSupabase()
  const { toast } = useToast()
  // const [user, setUser] = useState<User | null>(providerUser) // providerUser를 직접 사용
  const [profile, setProfile] = useState<any>(null)
  const [username, setUsername] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true) // 프로필 데이터 로딩 상태

  // sbIsLoading: Supabase 클라이언트 초기화 중
  // authHasResolved: Supabase 인증 상태 (세션 로드 시도) 완료 여부
  const initialAuthCheckLoading = sbIsLoading || !authHasResolved;

  console.log(`ProfilePage: Render. sbIsLoading: ${sbIsLoading}, authHasResolved: ${authHasResolved}, providerUser: ${!!providerUser}`);

  // 타임아웃 처리
  useEffect(() => {
    // 이 타이머는 전체 페이지 준비 상태를 확인해야 함
    // initialAuthCheckLoading이 false가 되고, profileLoading도 false가 되거나,
    // 또는 authHasResolved && !providerUser (로그인 불필요) 일 때 페이지가 준비된 것으로 간주
    const pageIsConsideredReady = (!initialAuthCheckLoading && !profileLoading) || (authHasResolved && !providerUser);

    if (pageIsConsideredReady) return; // 페이지가 이미 준비되었으면 타임아웃 로직 불필요

    const timeout = setTimeout(() => {
      if (!authHasResolved) {
        console.error("ProfilePage: Timeout! Auth state not resolved after 5s. SupabaseProvider issue?");
        toast({
          title: "인증 오류",
          description: "인증 상태를 확인하는 데 시간이 너무 오래 걸립니다. 페이지를 새로고침하거나 다시 시도해주세요.",
          variant: "destructive",
        });
        // 이 경우 사용자를 auth 페이지로 보내는 것이 합리적일 수 있음
        // router.push("/auth"); 
      } else if (!providerUser) {
        // authHasResolved는 true이지만 providerUser가 없는 경우 (로그인되지 않음)
        console.log("ProfilePage: Timeout! Auth resolved, but no user. Redirecting to /auth.");
        toast({
          title: "로그인이 필요합니다",
          description: "프로필에 접근하려면 로그인이 필요합니다. 로그인 페이지로 이동합니다.",
          variant: "destructive"
        });
        router.push("/auth");
      }
      // initialAuthCheckLoading 이나 profileLoading 상태를 여기서 직접 false로 설정할 필요는 없음
      // 각 상태는 자신의 로직에 따라 업데이트되어야 함
    }, 5000);

    return () => clearTimeout(timeout);
  }, [authHasResolved, providerUser, initialAuthCheckLoading, profileLoading, router, toast]);

  // 프로필 데이터 가져오기
  useEffect(() => {
    console.log(`ProfilePage: Profile fetch useEffect. authHasResolved: ${authHasResolved}, providerUser: ${!!providerUser}, supabase: ${!!supabase}`);
    
    if (initialAuthCheckLoading) {
      console.log("ProfilePage: Waiting for initial auth check to complete before fetching profile.");
      return;
    }

    if (authHasResolved && providerUser && supabase) {
      console.log("ProfilePage: Auth resolved, user found. Fetching profile for:", providerUser.id.substring(0,8));
      setProfileLoading(true); // 프로필 로딩 시작
      fetchProfile(providerUser.id);
    } else if (authHasResolved && !providerUser) {
      console.log("ProfilePage: Auth resolved, no user. No profile to fetch.");
      setProfileLoading(false); // 프로필 로딩할 필요 없음
    }
    // sbIsLoading (initialAuthCheckLoading에 포함), supabase, providerUser, authHasResolved가 변경될 때 실행
  }, [initialAuthCheckLoading, supabase, providerUser, authHasResolved]); // fetchProfile을 dependency array에 추가하면 무한루프 가능성, fetchProfile 내부에서 상태변경 최소화

  const fetchProfile = async (userId: string) => {
    if (!supabase) {
      setProfileLoading(false);
      return;
    }
    
    console.log("ProfilePage: fetchProfile called for userId:", userId.substring(0,8));
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("ProfilePage: Error fetching profile:", error);
        
        // 프로필이 없으면 생성
        if (error.code === 'PGRST116' && providerUser) { // user 대신 providerUser 사용
          console.log("ProfilePage: Profile not found, creating new one");
          const metadata = providerUser.user_metadata || {};
          const newProfile = {
            id: userId,
            email: providerUser.email,
            username: metadata.name || metadata.user_name || metadata.preferred_username || (providerUser.email ? providerUser.email.split("@")[0] : `user_${userId.substring(0, 8)}`),
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
            setProfileLoading(false); // 프로필 생성 후 로딩 완료
            return;
          }
        }
        setProfileLoading(false); // 오류 발생 시 프로필 로딩 완료 (오류 상태)
        throw error;
      }
      
      console.log("ProfilePage: Profile fetched successfully");
      setProfile(data)
      setUsername(data.username || "")
      setProfileLoading(false); // 프로필 가져온 후 로딩 완료
    } catch (error) {
      console.error("ProfilePage: Exception in fetchProfile:", error);
      setProfileLoading(false); // 예외 발생 시 프로필 로딩 완료 (오류 상태)
      const err = error as PostgrestError;
      toast({
        title: "프로필 로드 실패",
        description: err.message || "프로필을 불러오는 데 실패했습니다",
        variant: "destructive",
      })
    }
  }

  const handleUpdateProfile = async () => {
    if (!providerUser || !supabase) return; // user 대신 providerUser 사용
    
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
      const { error } = await supabase.from("profiles").update({ username }).eq("id", providerUser.id) // user 대신 providerUser 사용

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
    if (!providerUser || !supabase) return; // user 대신 providerUser 사용
    
    try {
      // First delete user data from profiles table
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", providerUser.id) // user 대신 providerUser 사용

      if (profileError) throw profileError

      // Then delete user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(providerUser.id) // user 대신 providerUser 사용
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

  // initialAuthCheckLoading: Supabase 클라이언트 로딩 또는 초기 인증 상태 확인 중
  if (initialAuthCheckLoading) {
    console.log("ProfilePage: Rendering loading spinner (initialAuthCheckLoading is true)");
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // authHasResolved는 true이지만 providerUser가 없는 경우 (로그인되지 않음)
  if (authHasResolved && !providerUser) {
    console.log("ProfilePage: Auth resolved, no user. Rendering 'Login Required' message.");
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
  
  // authHasResolved는 true이고 providerUser가 있지만, 프로필이 아직 로딩 중인 경우
  if (authHasResolved && providerUser && profileLoading) {
    console.log("ProfilePage: User authenticated, profile is loading. Rendering spinner.");
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // authHasResolved는 true, providerUser가 있고, 프로필 로딩이 끝났지만 프로필이 없는 경우 (fetchProfile 실패 또는 생성 실패)
  if (authHasResolved && providerUser && !profile && !profileLoading) {
    console.log("ProfilePage: User authenticated, profile loading finished, but no profile data. Possible fetch/create error.");
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">프로필을 불러올 수 없습니다</h2>
            <p className="mb-6 text-gray-400">프로필 정보를 가져오거나 생성하는 데 문제가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
            <Button onClick={() => router.refresh()}>새로고침</Button>
          </div>
        </div>
      </div>
    );
  }
  
  // providerUser와 profile이 모두 있는 경우 (정상 상태)
  if (!providerUser || !profile) {
     // 이 경우는 위 조건들에서 이미 처리되었어야 함. 안전망으로 남겨두거나, 에러 로깅.
     console.error("ProfilePage: Fallback - user or profile missing unexpectedly. This should not happen.", { providerUser: !!providerUser, profile: !!profile, authHasResolved, initialAuthCheckLoading, profileLoading });
     return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">오류 발생</h2>
            <p className="mb-6 text-gray-400">프로필 정보를 표시하는 중 예기치 않은 오류가 발생했습니다.</p>
            <Button onClick={() => router.push("/")}>홈으로 이동</Button>
          </div>
        </div>
      </div>
    );
  }

  console.log("ProfilePage: Rendering main content with profile for user:", providerUser.id.substring(0,8));
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
              <Input id="email" value={providerUser.email || ''} disabled className="bg-gray-50 dark:bg-gray-800" />
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
            <Button onClick={handleUpdateProfile} disabled={isUpdating || !providerUser}>
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
                로그인 방법: {providerUser.app_metadata?.provider === "google" ? "Google" : providerUser.app_metadata?.provider === "github" ? "GitHub" : "카카오"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                가입일: {new Date(providerUser.created_at).toLocaleDateString()}
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
