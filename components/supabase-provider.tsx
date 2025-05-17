"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import type { SupabaseClient, Session, User, AuthChangeEvent, AuthTokenResponse } from "@supabase/supabase-js"

// Supabase 컨텍스트 타입 정의
interface SupabaseContextType {
  supabase: SupabaseClient | null;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
}

const SupabaseContext = createContext<SupabaseContextType | null>(null)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    try {
      // Supabase 클라이언트 초기화
      const client = createClient();
      setSupabase(client);
      
      // 현재 세션 확인
      client.auth.getSession().then((response: { data: { session: Session | null } }) => {
        const currentSession = response.data.session;
        setSession(currentSession);
        setUser(currentSession?.user || null);
        setIsLoading(false);
      });
      
      // 인증 상태 변경 리스너 설정
      const { data: authListener } = client.auth.onAuthStateChange(
        (event: AuthChangeEvent, newSession: Session | null) => {
          setSession(newSession);
          setUser(newSession?.user || null);
        }
      );
      
      // 클린업 시 리스너 제거
      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Error initializing Supabase client:", error);
      setIsLoading(false);
    }
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase, isLoading, user, session }}>
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
