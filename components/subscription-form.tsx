"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

export default function SubscriptionForm({ subscription, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    service_name: "",
    amount: "",
    billing_cycle: "monthly",
    next_payment_date: new Date(),
    notes: "",
  })

  useEffect(() => {
    if (subscription) {
      setFormData({
        ...subscription,
        amount: subscription.amount.toString(),
        next_payment_date: new Date(subscription.next_payment_date),
      })
    }
  }, [subscription])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, next_payment_date: date }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate form
    if (!formData.service_name || !formData.amount) {
      return
    }

    // Format data for submission
    const submissionData = {
      ...formData,
      amount: Number.parseFloat(formData.amount),
      next_payment_date: formData.next_payment_date.toISOString().split("T")[0],
    }

    onSubmit(submissionData)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#0f172a] border border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{subscription ? "구독 수정" : "새 구독 추가"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="service_name" className="text-gray-400">
                서비스 이름
              </Label>
              <Input
                id="service_name"
                name="service_name"
                value={formData.service_name}
                onChange={handleChange}
                required
                className="bg-[#1e293b] border-gray-700 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount" className="text-gray-400">
                구독료 (원)
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                required
                className="bg-[#1e293b] border-gray-700 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="billing_cycle" className="text-gray-400">
                결제 주기
              </Label>
              <Select
                value={formData.billing_cycle}
                onValueChange={(value) => handleSelectChange("billing_cycle", value)}
              >
                <SelectTrigger id="billing_cycle" className="bg-[#1e293b] border-gray-700 text-white">
                  <SelectValue placeholder="결제 주기 선택" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-gray-700 text-white">
                  <SelectItem value="weekly">주간</SelectItem>
                  <SelectItem value="monthly">월간</SelectItem>
                  <SelectItem value="quarterly">분기</SelectItem>
                  <SelectItem value="biannually">반기</SelectItem>
                  <SelectItem value="yearly">연간</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="next_payment_date" className="text-gray-400">
                다음 결제일
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-[#1e293b] border-gray-700 text-white hover:bg-gray-800"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.next_payment_date ? format(formData.next_payment_date, "yyyy-MM-dd") : "날짜 선택"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#1e293b] border-gray-700">
                  <Calendar
                    mode="single"
                    selected={formData.next_payment_date}
                    onSelect={handleDateChange}
                    initialFocus
                    className="bg-[#1e293b] text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes" className="text-gray-400">
                메모
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes || ""}
                onChange={handleChange}
                placeholder="구독에 대한 메모를 입력하세요 (선택사항)"
                className="bg-[#1e293b] border-gray-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              취소
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
