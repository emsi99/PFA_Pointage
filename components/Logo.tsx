import { ShieldCheck } from 'lucide-react'

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <div
        className="w-9 h-9 flex items-center justify-center shrink-0"
        style={{
          backgroundColor: '#2563eb',
          borderRadius: '9px',
          boxShadow: '0 0 12px rgba(37,99,235,0.35)',
        }}
      >
        <ShieldCheck size={18} className="text-white" strokeWidth={2} />
      </div>
      <span
        className="font-semibold text-base"
        style={{ color: 'var(--pp-text-primary)' }}
      >
        Pointage Pro
      </span>
    </div>
  )
}
