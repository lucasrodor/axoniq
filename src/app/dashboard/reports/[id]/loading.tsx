'use client'

export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-[var(--muted-foreground)] animate-pulse font-medium tracking-widest uppercase">
          Analisando Relatório...
        </p>
      </div>
    </div>
  )
}
