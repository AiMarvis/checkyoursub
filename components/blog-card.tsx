import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User } from "lucide-react"

export default function BlogCard({ post, tags, formatDate }) {
  const postTags = post.tags ? post.tags.map((tagId) => tags.find((tag) => tag.id === tagId)).filter(Boolean) : []

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-gray-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
      <Link href={`/blog/${post.slug}`}>
        <div className="relative h-48 overflow-hidden">
          {post.thumbnail_url ? (
            <img
              src={post.thumbnail_url || "/placeholder.svg"}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-800/30 to-purple-800/30 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {postTags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="bg-blue-900/20 border-blue-800 text-blue-400">
              {tag.name}
            </Badge>
          ))}
        </div>
        <Link href={`/blog/${post.slug}`}>
          <h3 className="text-xl font-semibold mb-2 hover:text-blue-400 transition-colors">{post.title}</h3>
        </Link>
        <p className="text-gray-400 mb-4 line-clamp-2">{post.summary}</p>
        <div className="flex items-center text-sm text-gray-500 space-x-4">
          <div className="flex items-center">
            <Calendar size={14} className="mr-1" />
            <span>{formatDate(post.created_at)}</span>
          </div>
          <div className="flex items-center">
            <User size={14} className="mr-1" />
            <span>{post.profiles?.username || "익명"}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link href={`/blog/${post.slug}`} className="text-blue-400 text-sm font-medium hover:underline">
          계속 읽기
        </Link>
      </CardFooter>
    </Card>
  )
}
