"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, User } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"
import ReactMarkdown from "react-markdown"

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const { supabase } = useSupabase()
  const [post, setPost] = useState(null)
  const [tags, setTags] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.slug) {
      fetchPost(params.slug)
      fetchTags()
    }
  }, [params.slug])

  const fetchPost = async (slug) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(`
          *,
          profiles:author_id (username, avatar_url)
        `)
        .eq("slug", slug)
        .single()

      if (error) throw error
      setPost(data)
    } catch (error) {
      console.error("Error fetching post:", error)
      router.push("/blog")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase.from("tags").select("*")

      if (error) throw error
      setTags(data || [])
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }

  const formatDate = (dateString) => {
    return format(new Date(dateString), "yyyy년 MM월 dd일", { locale: ko })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">게시글을 찾을 수 없습니다</h1>
          <Button asChild>
            <Link href="/blog">블로그로 돌아가기</Link>
          </Button>
        </div>
      </div>
    )
  }

  const postTags = post.tags ? post.tags.map((tagId) => tags.find((tag) => tag.id === tagId)).filter(Boolean) : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/blog" className="flex items-center">
            <ArrowLeft size={16} className="mr-2" />
            블로그로 돌아가기
          </Link>
        </Button>

        {post.thumbnail_url && (
          <div className="relative h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
            <img
              src={post.thumbnail_url || "/placeholder.svg"}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {postTags.map((tag) => (
            <Badge key={tag.id} variant="outline">
              {tag.name}
            </Badge>
          ))}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center text-gray-500 mb-8">
          <div className="flex items-center mr-4">
            <Calendar size={16} className="mr-1" />
            <span>{formatDate(post.created_at)}</span>
          </div>
          <div className="flex items-center">
            <User size={16} className="mr-1" />
            <span>{post.profiles?.username || "익명"}</span>
          </div>
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
    </div>
  )
}
