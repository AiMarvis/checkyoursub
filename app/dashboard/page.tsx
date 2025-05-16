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

export default function DashboardPage() {
  const router = useRouter()
  const { supabase, isLoading } = useSupabase()
  const { toast } = useToast()
  const [user, setUser] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState(null)
  const [monthlyTotal, setMonthlyTotal] = useState(0)
  const [yearlyTotal, setYearlyTotal] = useState(0)
  const [upcomingPayments, setUpcomingPayments] = useState([])

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
      fetchSubscriptions(session.user.id)
    }

    if (!isLoading) {
      checkUser()
    }
  }, [supabase, router, isLoading])

  const fetchSubscriptions = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("next_payment_date", { ascending: true })

      if (error) {
        // Check if the error is because the table doesn't exist
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          console.error("Table 'subscriptions' does not exist. Database schema needs to be set up.")
          setSubscriptions([])
          setMonthlyTotal(0)
          setYearlyTotal(0)
          setUpcomingPayments([])

          toast({
            title: "데이터베이스 설정 필요",
            description: "Supabase 프로젝트에서 데이터베이스 스키마를 설정해주세요.",
            variant: "destructive",
          })
        } else {
          throw error
        }
      } else {
        setSubscriptions(data || [])
        calculateTotals(data || [])
        findUpcomingPayments(data || [])
      }
    } catch (error) {
      toast({
        title: "구독 정보 로드 실패",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const calculateTotals = (subs) => {
    let monthly = 0
    let yearly = 0

    subs.forEach((sub) => {
      const amount = Number.parseFloat(sub.amount)
      if (sub.billing_cycle === "monthly") {
        monthly += amount
        yearly += amount * 12
      } else if (sub.billing_cycle === "yearly") {
        monthly += amount / 12
        yearly += amount
      } else if (sub.billing_cycle === "weekly") {
        monthly += amount * 4.33 // Average weeks in a month
        yearly += amount * 52
      } else if (sub.billing_cycle === "quarterly") {
        monthly += amount / 3
        yearly += amount * 4
      } else if (sub.billing_cycle === "biannually") {
        monthly += amount / 6
        yearly += amount * 2
      }
    })

    setMonthlyTotal(monthly)
    setYearlyTotal(yearly)
  }

  const findUpcomingPayments = (subs) => {
    const today = new Date()
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(today.getDate() + 30)

    const upcoming = subs
      .filter((sub) => {
        const paymentDate = new Date(sub.next_payment_date)
        return paymentDate >= today && paymentDate <= thirtyDaysLater
      })
      .sort((a, b) => new Date(a.next_payment_date) - new Date(b.next_payment_date))

    setUpcomingPayments(upcoming)
  }

  const handleAddSubscription = () => {
    setEditingSubscription(null)
    setIsFormOpen(true)
  }

  const handleEditSubscription = (subscription) => {
    setEditingSubscription(subscription)
    setIsFormOpen(true)
  }

  const handleDeleteSubscription = async (id) => {
    try {
      const { error } = await supabase.from("subscriptions").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "구독 삭제 완료",
        description: "구독 정보가 성공적으로 삭제되었습니다.",
      })

      fetchSubscriptions(user.id)
    } catch (error) {
      toast({
        title: "구독 삭제 실패",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingSubscription(null)
  }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingSubscription) {
        const { error } = await supabase.from("subscriptions").update(formData).eq("id", editingSubscription.id)

        if (error) throw error

        toast({
          title: "구독 수정 완료",
          description: "구독 정보가 성공적으로 수정되었습니다.",
        })
      } else {
        const { error } = await supabase.from("subscriptions").insert({ ...formData, user_id: user.id })

        if (error) throw error

        toast({
          title: "구독 추가 완료",
          description: "새 구독이 성공적으로 추가되었습니다.",
        })
      }

      setIsFormOpen(false)
      setEditingSubscription(null)
      fetchSubscriptions(user.id)
    } catch (error) {
      toast({
        title: "구독 저장 실패",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

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
