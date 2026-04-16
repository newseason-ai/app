'use client'

export function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="pulse-card">
      <div className="pulse-label">{label}</div>
      <div className="pulse-value">{value}</div>
      <div className="pulse-sub">{sub}</div>
    </div>
  )
}