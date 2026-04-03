import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownDisplayProps {
  content: string
  className?: string
  raw?: boolean
}

export default function MarkdownDisplay({ content, className, raw }: MarkdownDisplayProps) {
  const baseClasses = raw 
    ? "" 
    : "prose prose-invert prose-blue max-w-none prose-p:leading-relaxed prose-headings:tracking-tight";
    
  return (
    <div className={cn(baseClasses, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
