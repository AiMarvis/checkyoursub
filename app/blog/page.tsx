"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

import BlogCard from "@/components/blog-card"

export default function BlogPage() {
  const { supabase } = useSupabase()
  const [posts, setPosts] = useState([])
  const [tags, setTags] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
    fetchTags()
  }, [])

  const fetchPosts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(`
        *,
        profiles:author_id (username, avatar_url)
      `)
        .order("created_at", { ascending: false })

      if (error) {
        // Check if the error is because the table doesn't exist
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          console.error("Table 'blog_posts' does not exist. Database schema needs to be set up.")
          setPosts([])
        } else {
          throw error
        }
      } else {
        setPosts(data || [])
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase.from("tags").select("*").order("name")

      if (error) {
        // Check if the error is because the table doesn't exist
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          console.error("Table 'tags' does not exist. Database schema needs to be set up.")
          setTags([])
        } else {
          throw error
        }
      } else {
        setTags(data || [])
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTag = !selectedTag || (post.tags && post.tags.includes(selectedTag))

    return matchesSearch && matchesTag
  })

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleTagClick = (tagId) => {
    setSelectedTag(selectedTag === tagId ? null : tagId)
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

  if (posts.length === 0 && tags.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI 툴 블로그</h1>
          <p className="text-gray-600 dark:text-gray-300">AI 툴 사용에 관한 유용한 팁과 정보를 확인하세요.</p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">데이터베이스 설정 필요</h2>
          <p className="mb-4">
            데이터베이스 스키마가 아직 설정되지 않았습니다. Supabase 프로젝트에서 다음 단계를 완료해주세요:
          </p>
          <ol className="list-decimal pl-5 space-y-2 mb-4">
            <li>Supabase 대시보드에 로그인하세요</li>
            <li>프로젝트의 SQL 편집기로 이동하세요</li>
            <li>
              프로젝트의{" "}
              <code className="bg-yellow-100 dark:bg-yellow-800 px-1 py-0.5 rounded">lib/supabase-schema.sql</code>{" "}
              파일에 있는 SQL을 실행하세요
            </li>
            <li>페이지를 새로고침하세요</li>
          </ol>
          <p>데이터베이스 스키마를 설정한 후에는 관리자 계정을 통해 블로그 게시물과 태그를 추가할 수 있습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI 툴 블로그</h1>
        <p className="text-gray-600 dark:text-gray-300">AI 툴 사용에 관한 유용한 팁과 정보를 확인하세요.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-3/4">
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input placeholder="블로그 검색..." value={searchQuery} onChange={handleSearchChange} className="pl-10" />
          </div>

          {filteredPosts.length > 0 ? (
            <div className="space-y-8">
              {filteredPosts.map((post) => (
                <BlogCard key={post.id} post={post} tags={tags} formatDate={formatDate} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-300">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>

        <div className="md:w-1/4">
          <div className="sticky top-24">
            <h3 className="text-lg font-semibold mb-4">태그</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTag === tag.id ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleTagClick(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
