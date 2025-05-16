"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { PlusCircle, Edit, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AdminToolsPage() {
  const router = useRouter()
  const { supabase, isLoading } = useSupabase()
  const { toast } = useToast()
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tools, setTools] = useState([])
  const [categories, setCategories] = useState([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTool, setEditingTool] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    website_url: "",
    logo_url: "",
    pricing_info: "",
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [toolToDelete, setToolToDelete] = useState(null)

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

      // Check if user is admin
      const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single()

      if (error || !data || !data.is_admin) {
        router.push("/dashboard")
        return
      }

      setIsAdmin(true)
      fetchTools()
      fetchCategories()
    }

    if (!isLoading) {
      checkUser()
    }
  }, [supabase, router, isLoading])

  const fetchTools = async () => {
    try {
      const { data, error } = await supabase.from("ai_tools").select("*").order("name")

      if (error) throw error
      setTools(data || [])
    } catch (error) {
      toast({
        title: "도구 로드 실패",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      toast({
        title: "카테고리 로드 실패",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleAddTool = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      website_url: "",
      logo_url: "",
      pricing_info: "",
    })
    setEditingTool(null)
    setIsFormOpen(true)
  }

  const handleEditTool = (tool) => {
    setFormData({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      website_url: tool.website_url || "",
      logo_url: tool.logo_url || "",
      pricing_info: tool.pricing_info || "",
    })
    setEditingTool(tool)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (tool) => {
    setToolToDelete(tool)
    setDeleteDialogOpen(true)
  }

  const handleDeleteTool = async () => {
    if (!toolToDelete) return

    try {
      const { error } = await supabase.from("ai_tools").delete().eq("id", toolToDelete.id)

      if (error) throw error

      toast({
        title: "도구 삭제 완료",
        description: "AI 도구가 성공적으로 삭제되었습니다.",
      })

      fetchTools()
    } catch (error) {
      toast({
        title: "도구 삭제 실패",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setToolToDelete(null)
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    if (!formData.name || !formData.description || !formData.category) {
      toast({
        title: "필수 항목 누락",
        description: "이름, 설명, 카테고리는 필수 항목입니다.",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingTool) {
        const { error } = await supabase.from("ai_tools").update(formData).eq("id", editingTool.id)

        if (error) throw error

        toast({
          title: "도구 수정 완료",
          description: "AI 도구가 성공적으로 수정되었습니다.",
        })
      } else {
        const { error } = await supabase.from("ai_tools").insert(formData)

        if (error) throw error

        toast({
          title: "도구 추가 완료",
          description: "새 AI 도구가 성공적으로 추가되었습니다.",
        })
      }

      setIsFormOpen(false)
      fetchTools()
    } catch (error) {
      toast({
        title: "도구 저장 실패",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">AI 툴 관리</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">AI 툴 정보를 추가, 수정, 삭제합니다.</p>
        </div>
        <Button onClick={handleAddTool} className="gap-2">
          <PlusCircle size={16} /> 새 AI 툴 추가
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI 툴 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {tools.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead className="w-[100px]">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.map((tool) => (
                    <TableRow key={tool.id}>
                      <TableCell className="font-medium">{tool.name}</TableCell>
                      <TableCell>{categories.find((c) => c.id === tool.category)?.name || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">{tool.description}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditTool(tool)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(tool)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">등록된 AI 툴이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tool Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingTool ? "AI 툴 수정" : "새 AI 툴 추가"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">이름 *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleFormChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">설명 *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">카테고리 *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website_url">웹사이트 URL</Label>
                <Input
                  id="website_url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleFormChange}
                  placeholder="https://"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logo_url">로고 URL</Label>
                <Input
                  id="logo_url"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleFormChange}
                  placeholder="https://"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pricing_info">가격 정보</Label>
                <Textarea
                  id="pricing_info"
                  name="pricing_info"
                  value={formData.pricing_info}
                  onChange={handleFormChange}
                  placeholder="무료 / 월 $10 / 연간 $99 등"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                취소
              </Button>
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. '{toolToDelete?.name}'(을)를 삭제하면 영구적으로 제거됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTool} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
