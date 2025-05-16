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
  const { supabase, isLoading: sbIsLoading } = useSupabase()
  const [posts, setPosts] = useState([])
  const [tags, setTags] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  console.log("BlogPage: Component rendered. sbIsLoading:", sbIsLoading, "supabase:", !!supabase);

  useEffect(() => {
    console.log("BlogPage: useEffect triggered. sbIsLoading:", sbIsLoading, "supabase:", !!supabase);
    
    if (!sbIsLoading && supabase) {
      console.log("BlogPage: Loading data - supabase is available and not loading");
      fetchPosts()
      fetchTags()
    } else {
      console.log("BlogPage: Waiting for supabase - sbIsLoading:", sbIsLoading);
    }
  }, [sbIsLoading, supabase])

  const fetchPosts = async () => {
    console.log("BlogPage: fetchPosts called");
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
          console.error("BlogPage: Table 'blog_posts' does not exist. Database schema needs to be set up.")
          setPosts([])
        } else {
          console.error("BlogPage: Error fetching posts:", error);
          throw error
        }
      } else {
        console.log("BlogPage: Posts fetched successfully, count:", data?.length || 0);
        setPosts(data || [])
      }
    } catch (error) {
      console.error("BlogPage: Exception in fetchPosts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTags = async () => {
    console.log("BlogPage: fetchTags called");
    try {
      const { data, error } = await supabase.from("tags").select("*")

      if (error) {
        // Check if the error is because the table doesn't exist
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          console.error("BlogPage: Table 'tags' does not exist. Database schema needs to be set up.")
          setTags([])
        } else {
          console.error("BlogPage: Error fetching tags:", error);
          throw error
        }
      } else {
        console.log("BlogPage: Tags fetched successfully, count:", data?.length || 0);
        setTags(data || [])
      }
    } catch (error) {
      console.error("BlogPage: Exception in fetchTags:", error)
    }
  }

  const formatDate = (dateString) => {
    return format(new Date(dateString), "yyyy년 MM월 dd일", { locale: ko })
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleTagClick = (tagId) => {
    setSelectedTag(selectedTag === tagId ? null : tagId)
  }

  const filteredPosts = posts.filter((post) => {
    // Filter by search query
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase())

    // Filter by tag
    const matchesTag = selectedTag === null || (post.tags && post.tags.includes(selectedTag))

    return matchesSearch && matchesTag
  })

  if (isLoading) {
    console.log("BlogPage: Rendering loading spinner (isLoading is true)");
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  console.log("BlogPage: Rendering main content with posts:", filteredPosts.length);
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
