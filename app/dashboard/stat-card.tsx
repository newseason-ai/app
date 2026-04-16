'use client'

import { useEffect, useState } from 'react'

export function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) return
    const duration = 800
    const steps = 40
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return (
    <div className="pulse-card">
      <div className="pulse-label">{label}</div>
      <div className="pulse-value">{display}</div>
      <div className="pulse-sub">{sub}</div>
    </div>
  )
}
