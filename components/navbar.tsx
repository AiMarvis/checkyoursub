"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/supabase-provider"
import { Menu, X, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// 사용자 타입 정의
type UserType = {
  id: string;
  email?: string;
  [key: string]: any;
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<UserType | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()
  const { supabase, isLoading: sbIsLoading } = useSupabase()

  console.log("Navbar: Component rendered. sbIsLoading:", sbIsLoading, "supabase:", !!supabase);

  useEffect(() => {
    console.log("Navbar: useEffect triggered. sbIsLoading:", sbIsLoading, "supabase:", !!supabase);
    
    // supabase가 null이면 리턴합니다
    if (!supabase) {
      console.log("Navbar: Supabase client is not available");
      return;
    }

    const checkUser = async () => {
      try {
        console.log("Navbar: Checking user session");
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Navbar: Error getting session:", error);
          return;
        }
        
        console.log("Navbar: Session found:", !!session);
        setUser(session?.user || null)

        if (session?.user) {
          // Check if user is admin
          try {
            const { data, error: profileError } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single()

            if (!profileError && data) {
              console.log("Navbar: User is admin:", data.is_admin);
              setIsAdmin(data.is_admin)
            } else {
              console.log("Navbar: Profile not found or error:", profileError);
              // 프로필이 없는 경우 새로 생성
              if (profileError && profileError.code === 'PGRST116') {
                console.log("Navbar: Creating new profile for user:", session.user.id);
                const { error: insertError } = await supabase.from("profiles").insert({
                  id: session.user.id,
                  email: session.user.email,
                  is_admin: false
                });
                
                if (insertError) {
                  console.error("Navbar: Error creating profile:", insertError);
                } else {
                  console.log("Navbar: Profile created successfully");
                }
              }
            }
          } catch (profileError) {
            console.error("Navbar: Error checking admin status:", profileError);
          }
        }
      } catch (sessionError) {
        console.error("Navbar: Session check error:", sessionError);
      }
    }

    checkUser()

    let authListener = null;
    
    try {
      // onAuthStateChange 리스너 설정
      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Navbar: Auth state changed:", event);
        setUser(session?.user || null)

        if (session?.user) {
          try {
            const { data } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single()
            setIsAdmin(data?.is_admin || false)
          } catch (error) {
            console.error("Navbar: Error checking admin status on auth change:", error);
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false)
        }
      })
      
      authListener = listener;
    } catch (error) {
      console.error("Navbar: Error setting up auth listener:", error);
    }

    return () => {
      if (authListener && authListener.subscription) {
        console.log("Navbar: Unsubscribing from auth listener");
        authListener.subscription.unsubscribe()
      }
    }
  }, [supabase, sbIsLoading])

  const handleSignOut = async () => {
    if (!supabase) {
      console.error("Navbar: Cannot sign out - Supabase client is not available");
      return;
    }
    
    try {
      await supabase.auth.signOut()
      console.log("Navbar: User signed out");
    } catch (error) {
      console.error("Navbar: Error signing out:", error);
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const navLinks = [
    { href: "/dashboard", label: "내 구독" },
    { href: "/tools", label: "AI 툴" },
    { href: "/blog", label: "블로그" },
  ]

  const adminLinks = [
    { href: "/admin/tools", label: "AI 툴 관리" },
    { href: "/admin/blog", label: "블로그 관리" },
  ]

  return (
    <nav className="bg-[#0a0f1a] border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold gradient-heading">
              ChekYourSub
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${pathname === link.href ? "nav-link-active" : "nav-link-inactive"}`}
              >
                {link.label}
              </Link>
            ))}

            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    관리자
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0f172a] border-gray-700">
                  {adminLinks.map((link) => (
                    <DropdownMenuItem
                      key={link.href}
                      asChild
                      className="text-gray-300 hover:text-white focus:text-white"
                    >
                      <Link href={link.href}>{link.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full bg-gray-800 hover:bg-gray-700">
                    <User size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0f172a] border-gray-700">
                  <DropdownMenuItem asChild className="text-gray-300 hover:text-white focus:text-white">
                    <Link href="/profile">프로필</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem onClick={handleSignOut} className="text-gray-300 hover:text-white focus:text-white">
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button className="bg-blue-600 hover:bg-blue-700">시작하기</Button>
              </Link>
            )}
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleMenu} className="text-gray-400 hover:text-white">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#0f172a] border-b border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === link.href ? "text-primary font-semibold" : "text-gray-400 hover:text-white"
                }`}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}

            {isAdmin &&
              adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white"
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ))}

            {user ? (
              <>
                <Link
                  href="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white"
                  onClick={closeMenu}
                >
                  프로필
                </Link>
                <button
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white"
                  onClick={() => {
                    handleSignOut()
                    closeMenu()
                  }}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white"
                onClick={closeMenu}
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
