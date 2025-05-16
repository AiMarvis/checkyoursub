"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"

// Supabase 컨텍스트의 타입 정의 (선택 사항이지만 권장)
interface SupabaseContextType {
  supabase: SupabaseClient | null;
  isLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | null>(null)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 컴포넌트가 마운트될 때 Supabase 클라이언트 초기화
    try {
      const client = createClient();
      setSupabase(client);
      
      // 자동 로그인 비활성화 - 세션 확인 로직 제거
      console.log("SupabaseProvider: 클라이언트 초기화됨 (자동 로그인 비활성화)");
      setIsLoading(false);
      
      // 컴포넌트 언마운트 시 클린업
      return () => {
        // 로그아웃 필요 없음 - 자동 로그인이 비활성화됨
      };
    } catch (error) {
      console.error("SupabaseProvider: 클라이언트 초기화 오류:", error);
      setIsLoading(false);
    }
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase, isLoading }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === null) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context
}
