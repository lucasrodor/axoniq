import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownDisplayProps {
  content: string
  className?: string
  raw?: boolean
  as?: 'div' | 'span'
}

export default function MarkdownDisplay({ content, className, raw, as: Component = 'div' }: MarkdownDisplayProps) {
  const baseClasses = raw 
    ? "" 
    : "prose prose-invert prose-blue max-w-none prose-p:leading-relaxed prose-headings:tracking-tight";
    
  return (
    <Component className={cn(baseClasses, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </Component>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
