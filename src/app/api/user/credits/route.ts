import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCreditsInfo } from '@/lib/credits'

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient()
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { data: { user } } = await supabaseAdmin.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const info = await getCreditsInfo(user.id)
    
    return NextResponse.json(info)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar créditos' }, { status: 500 })
  }
}
