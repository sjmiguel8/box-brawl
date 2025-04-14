type HealthDisplayProps = {
  label: string
  health: number
  color: string
}

export default function HealthDisplay({ label, health, color }: HealthDisplayProps) {
  return (
    <div className="flex-1 max-w-xs">
      <div className="text-sm font-bold mb-1">{label}</div>
      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${health}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}
