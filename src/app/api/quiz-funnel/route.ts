import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const LeadSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(8).optional(),
}).partial()

const SaveSchema = z.object({
  sessionId: z.string().uuid().optional().nullable(),
  currentStep: z.number().int().min(0).max(50).optional(),
  questionKey: z.string().trim().min(1).max(80).optional(),
  answer: z.unknown().optional(),
  answers: z.record(z.string(), z.unknown()).optional(),
  lead: LeadSchema.optional(),
  event: z.string().trim().min(1).max(80).optional(),
  resultProfile: z.string().trim().max(120).optional(),
  completed: z.boolean().optional(),
  checkoutPlan: z.string().trim().max(40).optional(),
  utm: z.record(z.string(), z.string()).optional(),
  sourceUrl: z.string().trim().max(500).optional(),
})

function getIp(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || req.headers.get('x-real-ip') || null
}

function eventEntry(name?: string, currentStep?: number) {
  if (!name) return null
  return {
    name,
    step: currentStep ?? null,
    at: new Date().toISOString(),
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = SaveSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const body = parsed.data
    const supabase = createAdminClient()
    const newEvent = eventEntry(body.event, body.currentStep)

    const baseFields = {
      ...(body.currentStep !== undefined ? { current_step: body.currentStep } : {}),
      ...(body.lead?.name ? { lead_name: body.lead.name } : {}),
      ...(body.lead?.email ? { lead_email: body.lead.email.toLowerCase() } : {}),
      ...(body.lead?.phone ? { lead_phone: body.lead.phone } : {}),
      ...(body.resultProfile ? { result_profile: body.resultProfile } : {}),
      ...(body.utm ? { utm: body.utm } : {}),
      ...(body.sourceUrl ? { source_url: body.sourceUrl } : {}),
      ...(body.completed ? { completed_at: new Date().toISOString() } : {}),
      ...(body.checkoutPlan ? {
        checkout_plan: body.checkoutPlan,
        checkout_clicked_at: new Date().toISOString(),
      } : {}),
    }

    if (!body.sessionId) {
      const answers = {
        ...(body.answers || {}),
        ...(body.questionKey ? { [body.questionKey]: body.answer ?? null } : {}),
      }
      const { data, error } = await supabase
        .from('quiz_funnel_sessions')
        .insert({
          ...baseFields,
          answers,
          events: newEvent ? [newEvent] : [],
          user_agent: req.headers.get('user-agent'),
          ip_address: getIp(req),
        })
        .select('id')
        .single()

      if (error) throw error
      return NextResponse.json({ sessionId: data.id })
    }

    const { data: existing, error: fetchError } = await supabase
      .from('quiz_funnel_sessions')
      .select('answers, events')
      .eq('id', body.sessionId)
      .maybeSingle()

    if (fetchError) throw fetchError

    if (!existing) {
      const { data, error } = await supabase
        .from('quiz_funnel_sessions')
        .insert({
          id: body.sessionId,
          ...baseFields,
          answers: body.answers || {},
          events: newEvent ? [newEvent] : [],
          user_agent: req.headers.get('user-agent'),
          ip_address: getIp(req),
        })
        .select('id')
        .single()

      if (error) throw error
      return NextResponse.json({ sessionId: data.id })
    }

    const answers = {
      ...(existing.answers || {}),
      ...(body.answers || {}),
      ...(body.questionKey ? { [body.questionKey]: body.answer ?? null } : {}),
    }

    const events = Array.isArray(existing.events) ? existing.events : []
    const nextEvents = newEvent ? [...events.slice(-80), newEvent] : events

    const { error } = await supabase
      .from('quiz_funnel_sessions')
      .update({
        ...baseFields,
        answers,
        events: nextEvents,
      })
      .eq('id', body.sessionId)

    if (error) throw error

    return NextResponse.json({ sessionId: body.sessionId })
  } catch (error: unknown) {
    console.error('Quiz funnel save error:', error)
    return NextResponse.json({ error: 'Erro ao salvar progresso' }, { status: 500 })
  }
}
