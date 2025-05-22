"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"
import Card3D from "@/components/3d-card"

export default function ToolsPage() {
  const { supabase, isLoading: sbIsLoading, user: providerUser, authHasResolved } = useSupabase()
  const [tools, setTools] = useState([])
  const [categories, setCategories] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("all")

  const initialAuthCheckLoading = sbIsLoading || !authHasResolved;

  console.log(`ToolsPage: Render. sbIsLoading: ${sbIsLoading}, authHasResolved: ${authHasResolved}, initialAuthCheckLoading: ${initialAuthCheckLoading}, supabase: ${!!supabase}`);

  useEffect(() => {
    console.log(`ToolsPage: Data fetching useEffect. initialAuthCheckLoading: ${initialAuthCheckLoading}, supabase: ${!!supabase}`);
    
    if (!initialAuthCheckLoading && supabase) {
      console.log("ToolsPage: Auth resolved, supabase available. Loading data.");
      fetchTools();
      fetchCategories();
    } else {
      console.log(`ToolsPage: Waiting for initial auth check or supabase client. initialAuthCheckLoading: ${initialAuthCheckLoading}, supabase: ${!!supabase}`);
      if (initialAuthCheckLoading) {
        // Ensure data loading spinner is active if auth is still pending
        setIsDataLoading(true);
      }
    }
  }, [initialAuthCheckLoading, supabase]); // Assuming fetchTools/fetchCategories are stable

  const fetchTools = async () => {
    console.log("ToolsPage: fetchTools called");
    setIsDataLoading(true);
    try {
      const { data, error } = await supabase.from("ai_tools").select("*").order("name")

      if (error) {
        // Check if the error is because the table doesn't exist
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          console.error("ToolsPage: Table 'ai_tools' does not exist. Database schema needs to be set up.")
          setTools([])
        } else {
          console.error("ToolsPage: Error fetching tools:", error)
          throw error
        }
      } else {
        console.log("ToolsPage: Tools fetched successfully, count:", data?.length || 0);
        setTools(data || [])
      }
    } catch (error) {
      console.error("ToolsPage: Exception in fetchTools:", error)
    } finally {
      setIsDataLoading(false);
    }
  }

  const fetchCategories = async () => {
    console.log("ToolsPage: fetchCategories called");
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name")

      if (error) {
        // Check if the error is because the table doesn't exist
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          console.error("ToolsPage: Table 'categories' does not exist. Database schema needs to be set up.")
          setCategories([])
        } else {
          console.error("ToolsPage: Error fetching categories:", error)
          throw error
        }
      } else {
        console.log("ToolsPage: Categories fetched successfully, count:", data?.length || 0);
        setCategories(data || [])
      }
    } catch (error) {
      console.error("ToolsPage: Exception in fetchCategories:", error)
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

  if (initialAuthCheckLoading || isDataLoading) {
    console.log(`ToolsPage: Rendering loading spinner. initialAuthCheckLoading: ${initialAuthCheckLoading}, isDataLoading: ${isDataLoading}`);
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  console.log("ToolsPage: Rendering main content with tools:", tools.length);
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
