"use client"

import { useState, useEffect } from "react"
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
  const { supabase, isLoading: sbIsLoading } = useSupabase()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<any>(null)
  const [monthlyTotal, setMonthlyTotal] = useState(0)
  const [yearlyTotal, setYearlyTotal] = useState(0)
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([])
  const [pageLoading, setPageLoading] = useState(true)

  console.log("DashboardPage: Component rendered. sbIsLoading:", sbIsLoading, "User:", user, "pageLoading:", pageLoading);

  useEffect(() => {
    console.log(`DashboardPage: checkUser effect triggered. sbIsLoading: ${sbIsLoading}, supabase available: ${!!supabase}`);
    setPageLoading(true)
    const checkUser = async () => {
      console.log("DashboardPage: checkUser function called.");
      if (!supabase) {
        console.log("DashboardPage: supabase client is not available in checkUser.");
        setPageLoading(false);
        return;
      }
      try {
        console.log("DashboardPage: Attempting to get session...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("DashboardPage: Error getting session:", sessionError);
          toast({ title: "세션 오류", description: sessionError.message, variant: "destructive" });
          router.push("/auth");
          return;
        }

        if (!session) {
          console.log("DashboardPage: No session found. Redirecting to /auth.");
          router.push("/auth");
          return;
        }
        
        console.log("DashboardPage: Session found. User:", session.user?.id);
        setUser(session.user);
        if (session.user?.id) {
            await fetchSubscriptions(session.user.id);
        }
      } catch (e: any) {
        console.error("DashboardPage: Exception in checkUser:", e);
        toast({ title: "인증 오류", description: e.message || "알 수 없는 인증 오류가 발생했습니다.", variant: "destructive" });
      } finally {
        setPageLoading(false);
      }
    }

    if (!sbIsLoading && supabase) {
      console.log("DashboardPage: sbIsLoading is false and supabase is available, calling checkUser.");
      checkUser();
    } else if (!supabase && !sbIsLoading) {
        console.log("DashboardPage: Supabase client not available, and not loading from provider. push to /auth");
        router.push("/auth"); 
        setPageLoading(false);
    } else {
      console.log(`DashboardPage: Not calling checkUser. sbIsLoading: ${sbIsLoading}, supabase available: ${!!supabase}`);
    }
  }, [supabase, router, sbIsLoading, toast]);

  const fetchSubscriptions = async (userId: string) => {
    console.log(`DashboardPage: fetchSubscriptions called for userId: ${userId}`);
    if (!supabase) {
        console.log("DashboardPage: supabase client is not available in fetchSubscriptions.");
        return;
    }
    try {
      const { data, error: dbError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("next_payment_date", { ascending: true });

      if (dbError) {
        console.error("DashboardPage: Error fetching subscriptions:", dbError);
        if (dbError.message.includes("relation") && dbError.message.includes("does not exist")) {
          console.warn("DashboardPage: 'subscriptions' table does not exist.");
          setSubscriptions([]);
          setMonthlyTotal(0);
          setYearlyTotal(0);
          setUpcomingPayments([]);
          toast({
            title: "데이터베이스 설정 필요",
            description: "구독 정보 테이블(subscriptions)이 존재하지 않습니다. Supabase 프로젝트에서 스키마를 확인해주세요.",
            variant: "destructive",
          });
        } else {
           toast({ title: "구독 정보 로드 오류", description: dbError.message, variant: "destructive" });
        }
      } else {
        console.log("DashboardPage: Subscriptions fetched successfully:", data);
        setSubscriptions(data || []);
        calculateTotals(data || []);
        findUpcomingPayments(data || []);
      }
    } catch (e: any) {
      console.error("DashboardPage: Exception in fetchSubscriptions:", e);
      toast({
        title: "구독 정보 로드 실패",
        description: e.message || "구독 정보를 가져오는 중 알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

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

  const findUpcomingPayments = (subs: any[]) => {
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
        console.warn("DashboardPage: User or Supabase client not available for delete.");
        return;
    }
    console.log(`DashboardPage: handleDeleteSubscription called for id: ${id}`);
    try {
      const { error: deleteError } = await supabase.from("subscriptions").delete().eq("id", id);
      if (deleteError) throw deleteError;
      toast({ title: "구독 삭제 완료", description: "구독 정보가 성공적으로 삭제되었습니다." });
      await fetchSubscriptions(user.id);
    } catch (e: any) {
      console.error("DashboardPage: Exception in handleDeleteSubscription:", e);
      toast({ title: "구독 삭제 실패", description: (e as AuthError)?.message || (e as Error)?.message || "구독 삭제 중 오류 발생", variant: "destructive" });
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSubscription(null);
  };

  const handleFormSubmit = async (formData: any) => {
    if (!user || !user.id || !supabase) {
        console.warn("DashboardPage: User or Supabase client not available for form submit.");
        return;
    }
    console.log(`DashboardPage: handleFormSubmit called. Editing: ${!!editingSubscription}`);
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
      await fetchSubscriptions(user.id);
    } catch (e: any) {
      console.error("DashboardPage: Exception in handleFormSubmit:", e);
      toast({ title: "구독 저장 실패", description: (e as AuthError)?.message || (e as Error)?.message || "구독 저장 중 오류 발생", variant: "destructive" });
    }
  };

  if (pageLoading) { 
    console.log("DashboardPage: Rendering loading spinner (pageLoading is true).");
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!user) {
    console.log("DashboardPage: Rendering null or redirecting (user is null after loading).");
    return null; 
  }

  console.log("DashboardPage: Rendering main content. User:", user?.id);
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-heading">내 구독 관리</h1>
          <p className="text-gray-400 mt-2">모든 AI 서비스 구독을 한눈에 관리하세요.</p>
        </div>
        <Button onClick={handleAddSubscription} className="mt-4 md:mt-0 gap-2 bg-blue-600 hover:bg-blue-700">
          <PlusCircle size={16} /> 구독 추가
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-[#0f172a] border border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">월 구독 비용</CardTitle>
            <CardDescription className="text-gray-400">모든 구독의 월간 합계</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-400">{monthlyTotal.toLocaleString()}원</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0f172a] border border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">연간 구독 비용</CardTitle>
            <CardDescription className="text-gray-400">모든 구독의 연간 합계</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-400">{yearlyTotal.toLocaleString()}원</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0f172a] border border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">다가오는 결제</CardTitle>
            <CardDescription className="text-gray-400">30일 이내 결제 예정</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingPayments.length > 0 ? (
              <div className="space-y-2">
                {upcomingPayments.slice(0, 2).map((sub) => (
                  <div key={sub.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">{sub.service_name}</p>
                      <p className="text-sm text-gray-500">{new Date(sub.next_payment_date).toLocaleDateString()}</p>
                    </div>
                    <p className="font-semibold text-cyan-400">{Number.parseFloat(sub.amount).toLocaleString()}원</p>
                  </div>
                ))}
                {upcomingPayments.length > 2 && (
                  <p className="text-sm text-gray-500 mt-2">외 {upcomingPayments.length - 2}개 더...</p>
                )}
              </div>
            ) : (
              <div className="flex items-center text-gray-500">
                <AlertCircle size={16} className="mr-2" />
                <p>30일 이내 예정된 결제가 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="mb-8">
        <TabsList className="bg-[#0f172a] border border-gray-800">
          <TabsTrigger value="list" className="data-[state=active]:bg-blue-900/30">
            목록
          </TabsTrigger>
          <TabsTrigger value="chart" className="data-[state=active]:bg-blue-900/30">
            차트
          </TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-6">
          {subscriptions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  onEdit={() => handleEditSubscription(subscription)}
                  onDelete={() => handleDeleteSubscription(subscription.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#0f172a] border border-gray-800 rounded-lg">
              <p className="text-gray-400 mb-4">아직 등록된 구독이 없습니다.</p>
              <Button onClick={handleAddSubscription} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <PlusCircle size={16} /> 첫 구독 추가하기
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="chart" className="mt-6">
          <div className="bg-[#0f172a] border border-gray-800 p-6 rounded-lg">
            <SubscriptionChart subscriptions={subscriptions} />
          </div>
        </TabsContent>
      </Tabs>

      {isFormOpen && (
        <SubscriptionForm subscription={editingSubscription} onClose={handleFormClose} onSubmit={handleFormSubmit} />
      )}
    </div>
  )
}
