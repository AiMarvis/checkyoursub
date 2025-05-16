"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"
import Card3D from "@/components/3d-card"

export default function ToolsPage() {
  const { supabase } = useSupabase()
  const [tools, setTools] = useState([])
  const [categories, setCategories] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("all")

  useEffect(() => {
    fetchTools()
    fetchCategories()
  }, [])

  const fetchTools = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("ai_tools").select("*").order("name")

      if (error) {
        // Check if the error is because the table doesn't exist
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          console.error("Table 'ai_tools' does not exist. Database schema needs to be set up.")
          setTools([])
        } else {
          throw error
        }
      } else {
        setTools(data || [])
      }
    } catch (error) {
      console.error("Error fetching tools:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name")

      if (error) {
        // Check if the error is because the table doesn't exist
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          console.error("Table 'categories' does not exist. Database schema needs to be set up.")
          setCategories([])
        } else {
          throw error
        }
      } else {
        setCategories(data || [])
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = activeCategory === "all" || tool.category === activeCategory

    return matchesSearch && matchesCategory
  })

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleCategoryChange = (value) => {
    setActiveCategory(value)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (tools.length === 0 && categories.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-heading">AI 툴 목록</h1>
          <p className="text-gray-400">다양한 AI 툴을 탐색하고 당신의 작업에 활용하세요.</p>
        </div>

        <div className="bg-[#0f172a] border border-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2 text-white">데이터베이스 설정 필요</h2>
          <p className="mb-4 text-gray-400">
            데이터베이스 스키마가 아직 설정되지 않았습니다. Supabase 프로젝트에서 다음 단계를 완료해주세요:
          </p>
          <ol className="list-decimal pl-5 space-y-2 mb-4 text-gray-400">
            <li>Supabase 대시보드에 로그인하세요</li>
            <li>프로젝트의 SQL 편집기로 이동하세요</li>
            <li>
              프로젝트의 <code className="bg-gray-800 px-1 py-0.5 rounded text-blue-400">lib/supabase-schema.sql</code>{" "}
              파일에 있는 SQL을 실행하세요
            </li>
            <li>페이지를 새로고침하세요</li>
          </ol>
          <p className="text-gray-400">
            데이터베이스 스키마를 설정한 후에는 관리자 계정을 통해 AI 툴과 카테고리를 추가할 수 있습니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-heading">AI 툴 목록</h1>
        <p className="text-gray-400">다양한 AI 툴을 탐색하고 당신의 작업에 활용하세요.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <Input
            placeholder="AI 툴 검색..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 bg-[#1e293b] border-gray-700 text-white"
          />
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={handleCategoryChange} className="mb-8">
        <TabsList className="mb-4 flex flex-wrap h-auto bg-[#0f172a] border border-gray-800">
          <TabsTrigger value="all" className="data-[state=active]:bg-blue-900/30">
            전체
          </TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="data-[state=active]:bg-blue-900/30">
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {filteredTools.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-8">
              {filteredTools.map((tool) => {
                const category = categories.find((c) => c.id === tool.category)
                return <Card3D key={tool.id} tool={tool} category={category} />
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#0f172a] border border-gray-800 rounded-lg">
              <p className="text-gray-400">검색 결과가 없습니다.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
