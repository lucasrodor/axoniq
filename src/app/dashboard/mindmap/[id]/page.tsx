'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import ReactFlow, { 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  Node,
  Edge,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Maximize2, Loader2, Zap, ChevronRight, ChevronDown } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Define local cn function
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const normalizeId = (id: any) => String(id).trim().toLowerCase()

// FINAL CONSTANTS FOR v9.0
const LEVEL_SPACING = 650 // MASSIVE SPACING TO PREVENT OVERLAP WITH ROOT
const NODE_HEIGHT = 100
const MIN_GAP = 50

// Custom Node Component
const MindMapNode = ({ data }: any) => {
  const isRoot = data.type === 'root'
  const isBranch = data.type === 'branch'
  const hasChildren = data.hasChildren
  const isExpanded = data.isExpanded
  const onToggle = data.onToggle

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        type: 'spring',
        stiffness: 260,
        damping: 20,
        duration: 0.3 
      }}
      className={cn(
        "relative px-8 py-5 rounded-[1.5rem] border font-bold text-sm backdrop-blur-xl transition-all flex items-center gap-4 min-w-[320px] group",
        isRoot 
          ? "bg-blue-600 border-blue-500 text-white text-base shadow-[0_0_30px_rgba(37,99,235,0.25)]" 
          : isBranch 
          ? "bg-zinc-900/80 border-zinc-800 text-zinc-100 shadow-xl hover:border-zinc-700 hover:bg-zinc-900" 
          : "bg-zinc-950/50 border-zinc-900 text-zinc-400 shadow-sm hover:border-zinc-800 hover:text-zinc-200"
      )}
    >
      {!isRoot && (
        <div className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-[3px] h-10 bg-blue-500/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      
      {!isRoot && <Handle type="target" position={Position.Left} className="!opacity-0" />}
      
      <span className={cn(
        "flex-1 tracking-tight leading-relaxed",
        isRoot && "uppercase tracking-[0.1em] font-black"
      )}>{data.label}</span>
      
      {hasChildren && (
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={cn(
            "p-2.5 rounded-xl transition-all active:scale-90 border",
            isRoot 
              ? "bg-blue-500 border-blue-400 hover:bg-blue-400 text-white" 
              : "bg-zinc-950 border-zinc-800 hover:border-blue-500/50 text-zinc-500 hover:text-blue-400"
          )}
        >
          {isExpanded ? <ChevronDown size={18} strokeWidth={3} /> : <ChevronRight size={18} strokeWidth={3} />}
        </button>
      )}

      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </motion.div>
  )
}

function MindMapViewPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { fitView } = useReactFlow()
  
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [mapTitle, setMapTitle] = useState('')

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [rawNodes, setRawNodes] = useState<any[]>([])
  const [rawEdges, setRawEdges] = useState<any[]>([])
  
  const nodeTypes = useMemo(() => ({ mindMapNode: MindMapNode }), [])
  
  const positionsCache = useRef<Map<string, number>>(new Map())
  const lastClickedId = useRef<string | null>(null)
  const isInitialized = useRef(false)

  const toggleExpand = useCallback((nodeId: string) => {
    const normId = normalizeId(nodeId)
    lastClickedId.current = normId
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(normId)) next.delete(normId)
      else next.add(normId)
      return next
    })
  }, [])

  useEffect(() => {
    const fetchMindMap = async () => {
      try {
        if (!id) return
        const { data, error } = await supabase
          .from('mind_maps')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        if (!data) throw new Error('Mapa não encontrado')

        setMapTitle(data.title)
        
        const rawJson = data.data_json
        const mmNodes = rawJson.nodes || rawJson.mind_map?.nodes || []
        const mmEdges = rawJson.edges || rawJson.mind_map?.edges || []
        
        setRawNodes(mmNodes)
        setRawEdges(mmEdges)

        const rootObj = mmNodes.find((n: any) => n.type === 'root') || mmNodes[0]
        if (rootObj) {
          setExpandedNodes(new Set([normalizeId(rootObj.id)]))
        }
      } catch (err) {
        console.error(err)
        toast('Erro ao carregar mapa mental', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchMindMap()
  }, [id, toast])

  useEffect(() => {
    if (rawNodes.length === 0) return

    const visibleNodesList: Node[] = []
    const visibleEdgesList: Edge[] = []
    const childrenMap = new Map<string, string[]>()
    
    rawEdges.forEach(edge => {
      const s = normalizeId(edge.source)
      const t = normalizeId(edge.target)
      if (!childrenMap.has(s)) childrenMap.set(s, [])
      childrenMap.get(s)!.push(t)
    })

    const rootNodeData = rawNodes.find(n => n.type === 'root') || rawNodes[0]
    if (!rootNodeData) return
    const rootIdString = normalizeId(rootNodeData.id)

    // ENGINE v9.0 GLOBAL LAYOUT
    let currentGlobalY = 0

    const computePositions = (nodeId: string, level: number): number => {
      const normId = normalizeId(nodeId)
      const nodeData = rawNodes.find(n => normalizeId(n.id) === normId)
      if (!nodeData) return 0

      const children = childrenMap.get(normId) || []
      const isExpanded = expandedNodes.has(normId)
      const childrenToRender = isExpanded ? children : []

      let finalY = 0

      if (childrenToRender.length === 0) {
        finalY = currentGlobalY
        currentGlobalY += (NODE_HEIGHT + MIN_GAP)
      } else {
        const childYs: number[] = []
        childrenToRender.forEach((childId) => {
          childYs.push(computePositions(childId, level + 1))
          
          visibleEdgesList.push({
            id: `e-${normId}-${normalizeId(childId)}`,
            source: normId,
            target: normalizeId(childId),
            animated: isExpanded,
            type: 'smoothstep',
            animated: true,
            style: { stroke: isExpanded ? '#3b82f6' : '#1e293b', strokeWidth: 2, opacity: isExpanded ? 0.8 : 0.4 },
            markerEnd: { type: MarkerType.ArrowClosed, color: isExpanded ? '#3b82f6' : '#1e293b' }
          })
        })
        finalY = (childYs[0] + childYs[childYs.length - 1]) / 2
      }

      visibleNodesList.push({
        id: normId,
        type: 'mindMapNode',
        data: { 
          label: nodeData.label, 
          type: nodeData.type,
          hasChildren: children.length > 0,
          isExpanded,
          onToggle: () => toggleExpand(normId)
        },
        position: { x: level * LEVEL_SPACING, y: finalY }
      })

      return finalY
    }

    computePositions(rootIdString, 0)

    // RE-CENTER ROOT AT 0
    const rootInList = visibleNodesList.find(n => n.id === rootIdString)
    if (rootInList) {
        const offset = -rootInList.position.y
        visibleNodesList.forEach(n => n.position.y += offset)
    }

    // ANCHORING
    const anchorId = lastClickedId.current || rootIdString
    const currentAnchor = visibleNodesList.find(n => n.id === anchorId)
    const cachedY = positionsCache.current.get(anchorId)

    if (currentAnchor && cachedY !== undefined) {
      const shift = cachedY - currentAnchor.position.y
      visibleNodesList.forEach(n => n.position.y += shift)
    }

    visibleNodesList.forEach(n => positionsCache.current.set(n.id, n.position.y))

    setNodes(visibleNodesList)
    setEdges(visibleEdgesList)

    if (!isInitialized.current && visibleNodesList.length > 0) {
      setTimeout(() => {
        fitView({ duration: 800, padding: 0.1 })
        isInitialized.current = true
      }, 500)
    }
  }, [rawNodes, rawEdges, expandedNodes, toggleExpand, setNodes, setEdges, fitView])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090B] text-white overflow-hidden relative">
      {/* Background Aurora */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mb-10 shadow-2xl animate-pulse">
          <Zap className="w-10 h-10 text-blue-500 fill-blue-500" />
        </div>
        <div className="space-y-4 text-center">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] animate-pulse">Iniciando Protocolo</p>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">Mapeamento Neural</h2>
          <div className="flex items-center gap-1.5 justify-center pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-[#09090B] overflow-hidden font-sans selection:bg-blue-500/30">
      <header className="h-24 px-10 border-b border-zinc-800/50 bg-[#09090B]/80 backdrop-blur-2xl flex items-center justify-between z-10 shadow-2xl relative">
        <div className="absolute bottom-0 left-0 w-1/4 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        
        <div className="flex items-center gap-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard')} 
            className="h-12 px-5 bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:text-white rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] transition-all hover:scale-105 active:scale-95"
          >
            <ChevronLeft size={16} className="mr-2" /> PAINEL
          </Button>
          
          <div className="flex items-center gap-4">
             <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.1)]">
              <Zap size={20} className="text-blue-500 fill-blue-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">MAPA NEURAL EM TEMPO REAL</span>
              <h1 className="font-black text-xl text-zinc-100 tracking-tight leading-none truncate max-w-xl">{mapTitle}</h1>
            </div>
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => fitView({ duration: 800, padding: 0.15 })} 
          className="h-12 px-6 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all hover:scale-105 active:scale-95 hover:bg-blue-500 border-none"
        >
          <Maximize2 size={16} className="mr-3" /> RECENTRALIZAR
        </Button>
      </header>

      <main className="flex-1 relative">
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange} 
          nodeTypes={nodeTypes}
            minZoom={0.05}
            maxZoom={2}
          >
            <Controls className="flex flex-col gap-2 !bg-zinc-950/80 !border-zinc-800 !p-2 !shadow-2xl rounded-2xl overflow-hidden [&_button]:!bg-zinc-900 [&_button]:!border-zinc-800 [&_button]:!text-zinc-400 [&_button]:hover:!bg-zinc-800 [&_button]:hover:!text-white [&_button]:!transition-all [&_button]:!rounded-xl [&_button]:!w-10 [&_button]:!h-10 [&_button]:!mb-1 last:[&_button]:!mb-0 [&_svg]:!w-5 [&_svg]:!h-5" showInteractive={false} />
            <Background color="#111111" gap={30} variant={BackgroundVariant.Dots} size={2} />
            {/* Custom overlay grid */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.02)_0%,transparent_70%)]" />
          </ReactFlow>
      </main>
    </div>
  )
}

export default function MindMapViewPageWithProvider() {
  return (
    <ReactFlowProvider>
      <MindMapViewPage />
    </ReactFlowProvider>
  )
}
