"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"

interface Tag {
  id: string
  name: string
}

interface PostFormData {
  title: string
  slug: string
  summary: string
  content: string
  thumbnail_url: string
}

export default function EditBlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const { supabase, isLoading } = useSupabase()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    slug: "",
    summary: "",
    content: "",
    thumbnail_url: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) return

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
        toast({
          title: "권한 없음",
          description: "이 페이지에 접근할 권한이 없습니다.",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      setIsAdmin(true)
      const postId = Array.isArray(params.id) ? params.id[0] : params.id
      if (postId) {
        fetchTags()
        fetchPost(postId)
      }
    }

    if (!isLoading && params.id && supabase) {
      checkUser()
    }
  }, [supabase, router, isLoading, params.id, toast])

  const fetchPost = async (id: string) => {
    if (!supabase) return
    try {
      const { data, error } = await supabase.from("blog_posts").select("*, tags").eq("id", id).single()

      if (error) throw error

      if (data) {
        setFormData({
          title: data.title || "",
          slug: data.slug || "",
          summary: data.summary || "",
          content: data.content || "",
          thumbnail_url: data.thumbnail_url || "",
        })
        setSelectedTags(Array.isArray(data.tags) ? data.tags.map(String) : [])
        setIsLoaded(true)
      } else {
        throw new Error("게시글 데이터를 찾을 수 없습니다.")
      }
    } catch (error) {
      toast({
        title: "게시글 로드 실패",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
      router.push("/admin/blog")
    }
  }

  const fetchTags = async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase.from("tags").select("*").order("name")

      if (error) throw error
      setTags(data || [])
    } catch (error) {
      toast({
        title: "태그 로드 실패",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!supabase) return

    // Validate form
    if (!formData.title || !formData.slug || !formData.summary || !formData.content) {
      toast({
        title: "필수 항목 누락",
        description: "제목, 슬러그, 요약, 내용은 필수 항목입니다.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const postId = Array.isArray(params.id) ? params.id[0] : params.id
      if (!postId) {
        throw new Error("게시글 ID가 없습니다.")
      }
      const { error } = await supabase
        .from("blog_posts")
        .update({
          ...formData,
          tags: selectedTags,
        })
        .eq("id", postId)

      if (error) throw error

      toast({
        title: "게시글 수정 완료",
        description: "블로그 게시글이 성공적으로 수정되었습니다.",
      })

      router.push("/admin/blog")
    } catch (error) {
      toast({
        title: "게시글 수정 실패",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  if (isLoading || !user || !isAdmin || !isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/blog" className="flex items-center">
            <ArrowLeft size={16} className="mr-2" />
            블로그 관리로 돌아가기
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">블로그 게시글 수정</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">제목 *</Label>
                    <Input id="title" name="title" value={formData.title} onChange={handleFormChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">슬러그 * (URL에 사용됨)</Label>
                    <Input id="slug" name="slug" value={formData.slug} onChange={handleFormChange} required />
                    <p className="text-sm text-gray-500">예: my-blog-post</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="summary">요약 *</Label>
                    <Textarea
                      id="summary"
                      name="summary"
                      value={formData.summary}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">내용 * (Markdown 지원)</Label>
                    <Textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleFormChange}
                      className="min-h-[300px] font-mono"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail_url">썸네일 URL</Label>
                    <Input
                      id="thumbnail_url"
                      name="thumbnail_url"
                      value={formData.thumbnail_url}
                      onChange={handleFormChange}
                      placeholder="https://"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>태그</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleTag(tag.id)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "저장 중..." : "변경사항 저장"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
