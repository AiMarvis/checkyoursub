"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import SubscriptionForm from "@/components/subscription-form"
import SubscriptionCard from "@/components/subscription-card"
import SubscriptionChart from "@/components/subscription-chart"
import type { AuthError, User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const router = useRouter()
  const { supabase, isLoading: sbIsLoading, user: providerUser, session: providerSession } = useSupabase()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(providerUser)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<any>(null)
  const [monthlyTotal, setMonthlyTotal] = useState(0)
  const [yearlyTotal, setYearlyTotal] = useState(0)
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  
  // 디버깅을 위한 로그
  useEffect(() => {
    console.log("DashboardPage: 초기 렌더링", {
      sbIsLoading,
      providerUser: providerUser?.id ? providerUser.id.substring(0, 8) + '...' : 'null',
      providerSession: providerSession ? '있음' : '없음'
    });
  }, [sbIsLoading, providerUser, providerSession]);

  // 타임아웃 처리
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (pageLoading) {
        console.log("DashboardPage: 로딩 타임아웃 발생");
        setPageLoading(false);
        
        // 세션이 없을 경우 홈으로 리디렉션
        if (!user && !providerUser) {
          console.log("DashboardPage: 세션 없음, 홈으로 리디렉션");
          toast({ 
            title: "로그인이 필요합니다", 
            description: "대시보드에 접근하려면 로그인이 필요합니다.", 
            variant: "destructive" 
          });
          
          // 타임아웃 후 리디렉션
          setTimeout(() => {
            router.push("/");
          }, 2000);
        }
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [pageLoading, user, providerUser, router, toast]);

  // 세션 검증 및 초기화
  useEffect(() => {
    console.log("DashboardPage: 세션 검증 useEffect 실행", { sbIsLoading });
    
    if (sbIsLoading) {
      console.log("DashboardPage: Supabase 로딩 중, 대기 중...");
      return;
    }
    
    // Provider에서 사용자가 이미 로드된 경우
    if (providerUser) {
      console.log("DashboardPage: Provider에서 사용자 발견:", providerUser.id.substring(0, 8));
      setUser(providerUser);
      setPageLoading(false);
      fetchSubscriptions(providerUser);
      return;
    }
    
    // Provider에 사용자가 없는 경우 세션 확인
    const checkSession = async () => {
      if (!supabase) {
        console.log("DashboardPage: Supabase 클라이언트 없음");
        setPageLoading(false);
        return;
      }
      
      try {
        console.log("DashboardPage: 세션 가져오기 시도");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("DashboardPage: 세션 가져오기 오류:", error);
          setPageLoading(false);
          return;
        }
        
        if (data?.session?.user) {
          console.log("DashboardPage: 유효한 세션 발견:", data.session.user.id.substring(0, 8));
          setUser(data.session.user);
          fetchSubscriptions(data.session.user);
        } else {
          console.log("DashboardPage: 세션 없음");
          // 앱 흐름 유지를 위해 여기서 리디렉션하지 않고 상태만 업데이트
        }
        
        setPageLoading(false);
      } catch (error) {
        console.error("DashboardPage: 세션 검증 중 오류:", error);
        setPageLoading(false);
      }
    };
    
    checkSession();
  }, [sbIsLoading, supabase, providerUser]);

  const fetchSubscriptions = useCallback(async (currentUser: User | null) => {
    if (!supabase || !currentUser) {
      console.log("DashboardPage: 구독 정보를 가져올 수 없음. Supabase 클라이언트 또는 사용자 정보 없음");
      return;
    }
    
    try {
      console.log("DashboardPage: 사용자 구독 정보 가져오기:", currentUser.id.substring(0, 8));
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", currentUser.id);
        
      if (error) {
        console.error("DashboardPage: 구독 정보 가져오기 오류:", error);
        toast({ title: "구독 정보 오류", description: error.message, variant: "destructive" });
        return;
      }
      
      console.log("DashboardPage: 구독 정보 가져오기 성공:", data?.length);
      setSubscriptions(data || []);
      
      // 구독 데이터가 있는 경우 금액 계산
      if (data && data.length > 0) {
        calculateTotals(data);
        calculateUpcomingPayments(data);
      }
    } catch (error) {
      console.error("DashboardPage: fetchSubscriptions 오류:", error);
      toast({ title: "오류 발생", description: "구독 정보를 가져오는 중 오류가 발생했습니다.", variant: "destructive" });
    }
  }, [supabase, toast]);

  const calculateTotals = (subs: any[]) => {
    let monthly = 0;
    let yearly = 0;
    subs.forEach((sub) => {
      const amount = Number.parseFloat(sub.amount);
      if (sub.billing_cycle === "monthly") {
        monthly += amount;
        yearly += amount * 12;
      } else if (sub.billing_cycle === "yearly") {
        monthly += amount / 12;
        yearly += amount;
      } else if (sub.billing_cycle === "weekly") {
        monthly += amount * 4.33; 
        yearly += amount * 52;
      } else if (sub.billing_cycle === "quarterly") {
        monthly += amount / 3;
        yearly += amount * 4;
      } else if (sub.billing_cycle === "biannually") {
        monthly += amount / 6;
        yearly += amount * 2;
      }
    });
    setMonthlyTotal(monthly);
    setYearlyTotal(yearly);
  };

  const calculateUpcomingPayments = (subs: any[]) => {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    const upcoming = subs
      .filter((sub) => {
        const paymentDate = new Date(sub.next_payment_date);
        return paymentDate >= today && paymentDate <= thirtyDaysLater;
      })
      .sort((a, b) => new Date(a.next_payment_date).getTime() - new Date(b.next_payment_date).getTime());
    setUpcomingPayments(upcoming);
  };

  const handleAddSubscription = () => {
    setEditingSubscription(null);
    setIsFormOpen(true);
  };

  const handleEditSubscription = (subscription: any) => {
    setEditingSubscription(subscription);
    setIsFormOpen(true);
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!user || !user.id || !supabase) {
        console.warn("DashboardPage: 삭제 작업을 위한 사용자 또는 Supabase 클라이언트 없음");
        return;
    }
    console.log(`DashboardPage: 구독 삭제 요청 ID: ${id}`);
    try {
      const { error: deleteError } = await supabase.from("subscriptions").delete().eq("id", id);
      if (deleteError) throw deleteError;
      toast({ title: "구독 삭제 완료", description: "구독 정보가 성공적으로 삭제되었습니다." });
      await fetchSubscriptions(user);
    } catch (e: any) {
      console.error("DashboardPage: 구독 삭제 중 오류:", e);
      toast({ title: "구독 삭제 실패", description: (e as AuthError)?.message || (e as Error)?.message || "구독 삭제 중 오류 발생", variant: "destructive" });
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSubscription(null);
  };

  const handleFormSubmit = async (formData: any) => {
    if (!user || !user.id || !supabase) {
        console.warn("DashboardPage: 폼 제출을 위한 사용자 또는 Supabase 클라이언트 없음");
        return;
    }
    console.log(`DashboardPage: 폼 제출 - 편집 모드: ${!!editingSubscription}`);
    try {
      if (editingSubscription) {
        const { error: updateError } = await supabase.from("subscriptions").update(formData).eq("id", editingSubscription.id);
        if (updateError) throw updateError;
        toast({ title: "구독 수정 완료", description: "구독 정보가 성공적으로 수정되었습니다." });
      } else {
        const { error: insertError } = await supabase.from("subscriptions").insert({ ...formData, user_id: user.id });
        if (insertError) throw insertError;
        toast({ title: "구독 추가 완료", description: "새 구독이 성공적으로 추가되었습니다." });
      }
      setIsFormOpen(false);
      setEditingSubscription(null);
      await fetchSubscriptions(user);
    } catch (e: any) {
      console.error("DashboardPage: 폼 제출 중 오류:", e);
      toast({ title: "구독 저장 실패", description: (e as AuthError)?.message || (e as Error)?.message || "구독 저장 중 오류 발생", variant: "destructive" });
    }
  };

  // 로딩 상태 표시
  if (pageLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인되지 않은 상태 처리
  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md bg-red-900/20 border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-300">
                <AlertCircle size={20} />
                로그인이 필요합니다
              </CardTitle>
              <CardDescription className="text-red-200">
                대시보드에 접근하려면 로그인이 필요합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <p className="text-sm text-red-200">로그인 페이지로 이동합니다...</p>
                <Button onClick={() => router.push("/")} variant="destructive">
                  홈으로 돌아가기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold gradient-heading">구독 관리 대시보드</h1>
        <Button onClick={handleAddSubscription} size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700">
          <PlusCircle size={16} />
          <span>구독 추가</span>
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-10">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-400">월간 구독 비용</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{monthlyTotal.toLocaleString()}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-400">연간 구독 비용</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{yearlyTotal.toLocaleString()}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-400">활성 구독</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{subscriptions.length}개</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">목록 보기</TabsTrigger>
          <TabsTrigger value="chart">차트 보기</TabsTrigger>
          <TabsTrigger value="upcoming">결제 예정</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="p-0 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subscriptions.length === 0 ? (
              <p className="text-center col-span-full text-gray-400 py-20">등록된 구독이 없습니다. 새 구독을 추가해보세요.</p>
            ) : (
              subscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  onEdit={() => handleEditSubscription(subscription)}
                  onDelete={() => handleDeleteSubscription(subscription.id)}
                />
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="chart" className="mt-6">
          <SubscriptionChart subscriptions={subscriptions} />
        </TabsContent>
        <TabsContent value="upcoming" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingPayments.length === 0 ? (
              <p className="text-center col-span-full text-gray-400 py-20">30일 이내에 예정된 결제가 없습니다.</p>
            ) : (
              upcomingPayments.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  onEdit={() => handleEditSubscription(subscription)}
                  onDelete={() => handleDeleteSubscription(subscription.id)}
                  showNextPayment
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {isFormOpen && (
        <SubscriptionForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
          initialData={editingSubscription}
        />
      )}
    </div>
  );
}
