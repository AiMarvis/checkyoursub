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
  const { supabase, isLoading: sbIsLoading, user: providerUser, session: providerSession, authHasResolved } = useSupabase()
  const { toast } = useToast()
  // const [user, setUser] = useState<User | null>(providerUser); // providerUser를 직접 사용
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<any>(null)
  const [monthlyTotal, setMonthlyTotal] = useState(0)
  const [yearlyTotal, setYearlyTotal] = useState(0)
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([])
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true); // 구독 데이터 로딩 상태

  const initialAuthCheckLoading = sbIsLoading || !authHasResolved;

  console.log(`DashboardPage: Render. sbIsLoading: ${sbIsLoading}, authHasResolved: ${authHasResolved}, providerUser: ${!!providerUser}`);
  
  // 타임아웃 처리
  useEffect(() => {
    const pageIsConsideredReady = (!initialAuthCheckLoading && !subscriptionsLoading) || (authHasResolved && !providerUser);
    if (pageIsConsideredReady) return;

    const timeout = setTimeout(() => {
      if (!authHasResolved) {
        console.error("DashboardPage: Timeout! Auth state not resolved after 5s. SupabaseProvider issue?");
        toast({
          title: "인증 오류",
          description: "인증 상태를 확인하는 데 시간이 너무 오래 걸립니다. 페이지를 새로고침하거나 다시 시도해주세요.",
          variant: "destructive",
        });
        // Consider redirecting to /auth or home
        // router.push("/auth"); 
      } else if (!providerUser) {
        console.log("DashboardPage: Timeout! Auth resolved, but no user. Redirecting to / (home).");
        toast({
          title: "로그인이 필요합니다",
          description: "대시보드에 접근하려면 로그인이 필요합니다. 홈으로 이동합니다.",
          variant: "destructive"
        });
        router.push("/"); // 또는 /auth
      }
      // If timeout occurs while subscriptions are still loading for an authenticated user,
      // it might indicate a problem with fetchSubscriptions or network.
      // subscriptionsLoading state will prevent premature rendering.
    }, 5000); // 5초 타임아웃

    return () => clearTimeout(timeout);
  }, [authHasResolved, providerUser, initialAuthCheckLoading, subscriptionsLoading, router, toast]);

  // 구독 데이터 가져오기
  const fetchSubscriptions = useCallback(async (currentUser: User) => { // currentUser is now guaranteed to be non-null
    if (!supabase) {
      console.log("DashboardPage: Supabase client not available for fetching subscriptions.");
      setSubscriptionsLoading(false);
      return;
    }
    
    console.log("DashboardPage: Fetching subscriptions for user:", currentUser.id.substring(0, 8));
    setSubscriptionsLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", currentUser.id);
        
      if (error) {
        console.error("DashboardPage: Error fetching subscriptions:", error);
        toast({ title: "구독 정보 오류", description: error.message, variant: "destructive" });
        setSubscriptions([]); // Clear subscriptions on error
      } else {
        console.log("DashboardPage: Subscriptions fetched successfully:", data?.length);
        setSubscriptions(data || []);
        if (data && data.length > 0) {
          calculateTotals(data);
          calculateUpcomingPayments(data);
        } else {
          // No data, reset totals
          setMonthlyTotal(0);
          setYearlyTotal(0);
          setUpcomingPayments([]);
        }
      }
    } catch (error) {
      console.error("DashboardPage: Exception in fetchSubscriptions:", error);
      toast({ title: "오류 발생", description: "구독 정보를 가져오는 중 오류가 발생했습니다.", variant: "destructive" });
      setSubscriptions([]);
    } finally {
      setSubscriptionsLoading(false);
    }
  }, [supabase, toast]); // calculateTotals and calculateUpcomingPayments are stable if defined outside or memoized

  // useEffect to trigger fetchSubscriptions
  useEffect(() => {
    console.log(`DashboardPage: Subscriptions fetch useEffect. authHasResolved: ${authHasResolved}, providerUser: ${!!providerUser}`);
    if (initialAuthCheckLoading) {
      console.log("DashboardPage: Waiting for initial auth check before fetching subscriptions.");
      return;
    }

    if (authHasResolved && providerUser) {
      fetchSubscriptions(providerUser);
    } else if (authHasResolved && !providerUser) {
      console.log("DashboardPage: Auth resolved, no user. No subscriptions to fetch.");
      setSubscriptionsLoading(false); // Not loading subscriptions if no user
      setSubscriptions([]); // Clear any existing subscription data
      setMonthlyTotal(0);
      setYearlyTotal(0);
      setUpcomingPayments([]);
    }
  }, [initialAuthCheckLoading, authHasResolved, providerUser, fetchSubscriptions]);

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
    if (!providerUser || !providerUser.id || !supabase) { // Use providerUser
        console.warn("DashboardPage: User or Supabase client not available for delete operation.");
        return;
    }
    console.log(`DashboardPage: Requesting delete for subscription ID: ${id}`);
    try {
      const { error: deleteError } = await supabase.from("subscriptions").delete().eq("id", id);
      if (deleteError) throw deleteError;
      toast({ title: "구독 삭제 완료", description: "구독 정보가 성공적으로 삭제되었습니다." });
      if (providerUser) fetchSubscriptions(providerUser); // Refresh subscriptions
    } catch (e: any) {
      console.error("DashboardPage: Error deleting subscription:", e);
      toast({ title: "구독 삭제 실패", description: (e as AuthError)?.message || (e as Error)?.message || "구독 삭제 중 오류 발생", variant: "destructive" });
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSubscription(null);
  };

  const handleFormSubmit = async (formData: any) => {
    if (!providerUser || !providerUser.id || !supabase) { // Use providerUser
        console.warn("DashboardPage: User or Supabase client not available for form submission.");
        return;
    }
    console.log(`DashboardPage: Form submission - Editing mode: ${!!editingSubscription}`);
    try {
      if (editingSubscription) {
        const { error: updateError } = await supabase.from("subscriptions").update(formData).eq("id", editingSubscription.id);
        if (updateError) throw updateError;
        toast({ title: "구독 수정 완료", description: "구독 정보가 성공적으로 수정되었습니다." });
      } else {
        const { error: insertError } = await supabase.from("subscriptions").insert({ ...formData, user_id: providerUser.id }); // Use providerUser.id
        if (insertError) throw insertError;
        toast({ title: "구독 추가 완료", description: "새 구독이 성공적으로 추가되었습니다." });
      }
      setIsFormOpen(false);
      setEditingSubscription(null);
      if (providerUser) fetchSubscriptions(providerUser); // Refresh subscriptions
    } catch (e: any) {
      console.error("DashboardPage: Error submitting form:", e);
      toast({ title: "구독 저장 실패", description: (e as AuthError)?.message || (e as Error)?.message || "구독 저장 중 오류 발생", variant: "destructive" });
    }
  };

  // 로딩 상태 표시: 초기 인증 확인 중이거나, 사용자가 있는데 구독 정보 로딩 중일 때
  if (initialAuthCheckLoading || (authHasResolved && providerUser && subscriptionsLoading)) {
    console.log(`DashboardPage: Rendering loading spinner. initialAuthCheckLoading: ${initialAuthCheckLoading}, subscriptionsLoading: ${subscriptionsLoading}`);
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  // 로그인되지 않은 상태 처리: 인증 상태 확인 완료되었고, 사용자가 없을 때
  if (authHasResolved && !providerUser) {
    console.log("DashboardPage: Auth resolved, no user. Rendering 'Login Required' message.");
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
                <p className="text-sm text-red-200">로그인 페이지로 이동하거나 홈으로 돌아갈 수 있습니다.</p>
                <Button onClick={() => router.push("/auth")} variant="outline">
                  로그인 페이지로 이동
                </Button>
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
  
  // Fallback for unexpected state - should ideally not be reached if logic above is correct
  if (!providerUser && authHasResolved) {
    // This case should be caught by the block above. Logging for safety.
    console.error("DashboardPage: Unexpected state - authResolved but no providerUser, and not caught by Login Required block.");
    return (
      <div className="container mx-auto py-10 text-center text-red-500">
        오류: 사용자 인증 상태를 확인할 수 없습니다. 홈으로 이동해주세요.
        <Button onClick={() => router.push("/")} className="mt-4">홈으로</Button>
      </div>
    );
  }


  console.log(`DashboardPage: Rendering main content. User: ${providerUser?.id?.substring(0,8)}, Subscriptions: ${subscriptions.length}`);
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold gradient-heading">구독 관리 대시보드</h1>
        <Button onClick={handleAddSubscription} size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700" disabled={!providerUser}>
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
