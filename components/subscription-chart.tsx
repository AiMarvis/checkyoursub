"use client"

import { useEffect, useState } from "react"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"

ChartJS.register(ArcElement, Tooltip, Legend)

export default function SubscriptionChart({ subscriptions }) {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1,
      },
    ],
  })

  const [options, setOptions] = useState({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#e5e7eb",
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || ""
            const value = context.raw || 0
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = Math.round((value / total) * 100)
            return `${label}: ${value.toLocaleString()}원 (${percentage}%)`
          },
        },
      },
    },
  })

  useEffect(() => {
    if (subscriptions.length === 0) return

    // Generate chart data
    const labels = subscriptions.map((sub) => sub.service_name)
    const data = subscriptions.map((sub) => Number.parseFloat(sub.amount))

    // Generate colors - using more vibrant colors
    const backgroundColors = [
      "#3b82f6", // blue-500
      "#8b5cf6", // violet-500
      "#06b6d4", // cyan-500
      "#10b981", // emerald-500
      "#f59e0b", // amber-500
      "#ef4444", // red-500
      "#ec4899", // pink-500
      "#6366f1", // indigo-500
      "#84cc16", // lime-500
      "#f97316", // orange-500
    ]

    const borderColors = backgroundColors.map((color) => color)

    setChartData({
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors.slice(0, subscriptions.length),
          borderColor: borderColors.slice(0, subscriptions.length),
          borderWidth: 1,
        },
      ],
    })
  }, [subscriptions])

  if (subscriptions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-400">구독 정보가 없습니다.</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-white">구독 비용 분포</h3>
      <div className="h-80">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  )
}
