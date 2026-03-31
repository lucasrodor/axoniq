'use client'

interface MarkdownDisplayProps {
  content: string
  className?: string
}

export default function MarkdownDisplay({ content, className }: MarkdownDisplayProps) {
  return (
    <div className={className} style={{ whiteSpace: 'pre-wrap' }}>
      {content}
    </div>
  )
}
