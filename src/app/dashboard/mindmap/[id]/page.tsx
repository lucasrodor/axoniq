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
        "relative px-6 py-4 rounded-2xl border-2 font-semibold text-sm shadow-xl transition-all flex items-center gap-3 min-w-[280px]",
        isRoot ? "bg-blue-600 border-blue-500 text-white text-lg shadow-[0_0_25px_rgba(59,130,246,0.3)]" : 
        isBranch ? "bg-white border-blue-400 text-zinc-900 shadow-md" :
        "bg-zinc-50 border-zinc-200 text-zinc-600 shadow-sm"
      )}
    >
      {!isRoot && <Handle type="target" position={Position.Left} className="!opacity-0" />}
      
      <span className="flex-1 truncate leading-tight">{data.label}</span>
      
      {hasChildren && (
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={cn(
            "p-2 rounded-xl transition-all active:scale-90",
            isRoot ? "bg-blue-500 hover:bg-blue-400 text-white" : "bg-zinc-100 hover:bg-blue-100 text-zinc-400 hover:text-blue-600"
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
            type: 'default',
            style: { stroke: '#3b82f6', strokeWidth: 2, opacity: 0.8 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white font-mono">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
      <p className="animate-pulse tracking-widest text-sm uppercase">Gerando Estrutura...</p>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden font-sans">
      <header className="h-20 px-8 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-xl flex items-center justify-between z-10 shadow-2xl">
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-zinc-400 hover:text-white transition-all">
            <ChevronLeft size={20} className="mr-2" /> Painel
          </Button>
          <div className="h-8 w-px bg-zinc-800 mx-2" />
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-500/10 rounded-lg">
              <Zap size={22} className="text-blue-500 fill-blue-500" />
            </div>
            <h1 className="font-bold text-lg text-white truncate max-w-xl">{mapTitle}</h1>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => fitView({ duration: 800, padding: 0.15 })} className="shadow-xl shadow-blue-500/20 bg-blue-600 hover:bg-blue-500 text-white border-none px-6 font-bold transition-all hover:scale-105 active:scale-95">
          <Maximize2 size={18} className="mr-2" /> Recentralizar
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
          maxZoom={1.5}
        >
          <Controls className="!bg-zinc-900/80 !border-zinc-800 !text-white !fill-white shadow-2xl rounded-xl overflow-hidden" />
          <Background color="#1e293b" gap={25} variant={BackgroundVariant.Dots} size={1} />
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
