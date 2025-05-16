import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, BookOpen, CreditCard } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-purple-900/20 z-0"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-heading">관리하기 쉬운 AI 구독 플랫폼</h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            모든 AI 서비스 구독을 한 곳에서 관리하고, 새로운 AI 툴을 발견하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
                시작하기 <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/tools">
              <Button size="lg" variant="outline" className="gap-2 border-gray-700 text-gray-300 hover:bg-gray-800">
                AI tool 보기 <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/blog">
              <Button size="lg" variant="outline" className="gap-2 border-gray-700 text-gray-300 hover:bg-gray-800">
                블로그 <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 gradient-heading">주요 기능</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <FeatureCard
              icon={<CreditCard className="h-10 w-10 text-blue-400" />}
              title="구독 관리"
              description="모든 AI 서비스 구독을 한눈에 파악하고 관리하세요. 월별/연간 비용을 자동으로 계산해 드립니다."
            />
            <FeatureCard
              icon={<BarChart3 className="h-10 w-10 text-purple-400" />}
              title="비용 분석"
              description="구독 비용을 시각화하여 어디에 얼마나 지출하고 있는지 쉽게 파악할 수 있습니다."
            />
            <FeatureCard
              icon={<BookOpen className="h-10 w-10 text-cyan-400" />}
              title="AI 툴 정보"
              description="다양한 AI 툴에 대한 정보와 유용한 팁을 블로그를 통해 확인하세요."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 gradient-heading">지금 바로 시작하세요</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            AI 구독 관리를 더 이상 미루지 마세요. 지금 가입하고 모든 기능을 무료로 이용해보세요.
          </p>
          <Link href="/auth">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="feature-card">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-3 text-center text-white">{title}</h3>
      <p className="text-gray-400 text-center">{description}</p>
    </div>
  )
}
