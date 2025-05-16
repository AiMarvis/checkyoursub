"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Calendar, CreditCard } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

export default function SubscriptionCard({ subscription, onEdit, onDelete }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return format(date, "yyyy년 MM월 dd일", { locale: ko })
  }

  const getBillingCycleText = (cycle) => {
    const cycleMap = {
      weekly: "주간",
      monthly: "월간",
      quarterly: "분기",
      biannually: "반기",
      yearly: "연간",
    }
    return cycleMap[cycle] || cycle
  }

  const isPaymentSoon = () => {
    const today = new Date()
    const paymentDate = new Date(subscription.next_payment_date)
    const diffTime = paymentDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7
  }

  return (
    <Card className="overflow-hidden bg-[#0f172a] border border-gray-800 hover:border-blue-900/50 transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-start">
          <span className="text-xl text-white">{subscription.service_name}</span>
          {isPaymentSoon() && (
            <span className="text-xs px-2 py-1 bg-red-900/30 text-red-300 border border-red-800 rounded-full">
              곧 결제
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-3">
          <div className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2 text-blue-400" />
            <div className="flex justify-between w-full">
              <span className="text-gray-400">구독료:</span>
              <span className="font-semibold text-white">
                {Number.parseFloat(subscription.amount).toLocaleString()}원 /{" "}
                {getBillingCycleText(subscription.billing_cycle)}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-blue-400" />
            <div className="flex justify-between w-full">
              <span className="text-gray-400">다음 결제일:</span>
              <span className="text-white">{formatDate(subscription.next_payment_date)}</span>
            </div>
          </div>
          {subscription.notes && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-sm text-gray-400">{subscription.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
