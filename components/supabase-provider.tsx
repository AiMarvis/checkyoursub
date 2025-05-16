"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/components/ui/use-toast"

const SupabaseContext = createContext(null)

export function SupabaseProvider({ children }) {
  const { toast } = useToast()
  const [supabase] = useState(() => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase credentials are missing")
        toast({
          title: "설정 오류",
          description: "Supabase 환경 변수가 설정되지 않았습니다.",
          variant: "destructive",
        })
        return null
      }

      console.log("Initializing Supabase client with URL:", supabaseUrl)

      // 더 많은 옵션으로 클라이언트 생성
      return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error)
      toast({
        title: "Supabase 초기화 오류",
        description: "Supabase 클라이언트 초기화에 실패했습니다.",
        variant: "destructive",
      })
      return null
    }
  })

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.getSession()
          console.log("Current session:", data.session ? "Active" : "None")
          if (error) {
            console.error("Error checking session:", error)
          }
        } catch (error) {
          console.error("Error checking session:", error)
        }
      } else {
        console.warn("Supabase client is not initialized")
      }
      setIsLoading(false)
    }
    checkSession()

    // Auth 상태 변경 리스너 설정
    let authListener = null

    if (supabase) {
      try {
        authListener = supabase.auth.onAuthStateChange((event, session) => {
          console.log("Auth state changed:", event, session ? "Session exists" : "No session")
        })
      } catch (error) {
        console.error("Error setting up auth state change listener:", error)
      }
    }

    return () => {
      // 안전하게 unsubscribe 호출
      if (authListener && authListener.subscription && typeof authListener.subscription.unsubscribe === "function") {
        authListener.subscription.unsubscribe()
      }
    }
  }, [supabase])

  return <SupabaseContext.Provider value={{ supabase, isLoading }}>{children}</SupabaseContext.Provider>
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === null) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context
}
