"use client"

import { useState } from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function Card3D({ tool, category }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="w-[290px] h-[300px] perspective-[1000px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`h-full rounded-[50px] bg-gradient-to-br from-cyan-400 to-green-400 transition-all duration-500 ease-in-out transform-gpu preserve-3d shadow-lg ${
          isHovered ? "rotate-[30deg] shadow-xl" : ""
        }`}
      >
        {/* Glass Effect */}
        <div
          className="absolute inset-[8px] rounded-[55px] rounded-tr-full border-l border-b border-white/80 
          bg-gradient-to-b from-white/35 to-white/80 transform-gpu translate-z-[25px] transition-all duration-500 ease-in-out"
        ></div>

        {/* Content */}
        <div className="p-[30px] pt-[100px] pr-[60px] transform-gpu translate-z-[26px]">
          <span className="block text-emerald-800 font-black text-xl">{tool.name}</span>
          <span className="block text-emerald-800/75 text-sm mt-5 line-clamp-3">{tool.description}</span>
        </div>

        {/* Bottom */}
        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between transform-gpu translate-z-[26px]">
          <div className="flex items-center justify-end w-2/5 transition-all duration-200 ease-in-out hover:translate-z-[10px]">
            <Link
              href={tool.website_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <span className="text-emerald-600 font-bold text-xs">자세히 보기</span>
              <ExternalLink className="h-4 w-4 stroke-emerald-600 stroke-[3px]" />
            </Link>
          </div>

          <div className="flex gap-2 preserve-3d">
            {category && (
              <Badge className="bg-white text-emerald-700 hover:bg-black hover:text-white transition-colors">
                {category.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Logo Circles */}
        <div className="absolute right-0 top-0 preserve-3d">
          <span
            className={`block absolute aspect-square rounded-full top-0 right-0 shadow-md backdrop-blur-sm bg-cyan-400/20 transition-all duration-500 ease-in-out
            w-[170px] translate-z-[20px] top-[8px] right-[8px] ${isHovered ? "" : ""}`}
          ></span>

          <span
            className={`block absolute aspect-square rounded-full top-0 right-0 shadow-md backdrop-blur-sm bg-cyan-400/20 transition-all duration-500 ease-in-out delay-[400ms]
            w-[140px] translate-z-[40px] top-[10px] right-[10px] ${isHovered ? "translate-z-[60px]" : ""}`}
          ></span>

          <span
            className={`block absolute aspect-square rounded-full top-0 right-0 shadow-md backdrop-blur-sm bg-cyan-400/20 transition-all duration-500 ease-in-out delay-[800ms]
            w-[110px] translate-z-[60px] top-[17px] right-[17px] ${isHovered ? "translate-z-[80px]" : ""}`}
          ></span>

          <span
            className={`block absolute aspect-square rounded-full top-0 right-0 shadow-md backdrop-blur-sm bg-cyan-400/20 transition-all duration-500 ease-in-out delay-[1200ms]
            w-[80px] translate-z-[80px] top-[23px] right-[23px] ${isHovered ? "translate-z-[100px]" : ""}`}
          ></span>

          <span
            className={`block absolute aspect-square rounded-full top-0 right-0 shadow-md backdrop-blur-sm bg-cyan-400/20 transition-all duration-500 ease-in-out delay-[1600ms]
            w-[50px] translate-z-[100px] top-[30px] right-[30px] grid place-content-center ${isHovered ? "translate-z-[120px]" : ""}`}
          >
            {tool.logo_url ? (
              <img src={tool.logo_url || "/placeholder.svg"} alt={tool.name} className="w-5 h-5 rounded-full" />
            ) : (
              <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-emerald-700">
                {tool.name.charAt(0)}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
